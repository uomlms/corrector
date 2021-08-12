import { Consumer, AssignmentSubmitEvent, Topics, kafka, verifyToken, getObject } from '@uomlms/common';
import { Message } from 'node-rdkafka';
import { AssignmentCorrectionProducer } from '../producers/assignment-correction-producer';
import { SendMailProducer } from '../producers/send-mail-producer';
import { spawn } from "child_process";
import path from 'path';
import fs from 'fs';

export class AssignmentSubmitConsumer extends Consumer<AssignmentSubmitEvent> {
  readonly topic = Topics.AssignmentSubmitTopic;
  readonly pythonScriptPath = './src/python/corrector.py';
  readonly pythonExecutable = 'python3';

  runPython = (config: string, source: string, cb: any) => {
    const pythonProcess = spawn(this.pythonExecutable, [
      this.pythonScriptPath,
      source,
      config
    ]);
    pythonProcess.stdout.setEncoding("utf8");
    pythonProcess.stdout.on("data", (data) => {
      const response = JSON.parse(data);
      cb(response.status, response.result);
    });

    pythonProcess.stderr.setEncoding("utf8");
    pythonProcess.stderr.on("data", (data) => {
      console.log(data)
    });
  }


  saveFile = async (key: string) => {
    const object = await getObject(key);

    const dirname = `tmp/${path.dirname(key)}`;
    const filename = path.basename(key);

    // make sure folder exists
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    const localPath = path.join(dirname, filename);
    fs.writeFileSync(localPath, object.Body as Buffer);
    return localPath;
  }

  onMessage = async (data: AssignmentSubmitEvent['data'], message: Message) => {
    const user = verifyToken(data.user.token);
    const config = await this.saveFile(data?.configFile || "");
    const source = await this.saveFile(data.sourceFile || "");
    this.runPython(config, source, (status: string, result: string) => {
      console.log("Python Result: ", result);
      new AssignmentCorrectionProducer(kafka.producer).produce({
        assignmentId: data.assignmentId,
        submissionId: data.submissionId,
        status,
        result
      });
      if (user) {
        new SendMailProducer(kafka.producer).produce({
          to: user.email,
          subject: `[${status}] Result from submission ${data.submissionId}`,
          text: `Corrector output: ${result}`
        });
      }
    })

  }

}