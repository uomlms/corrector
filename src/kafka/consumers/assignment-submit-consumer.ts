import { Consumer, AssignmentSubmitEvent, Topics, kafka, verifyToken } from '@uomlms/common';
import { Message } from 'node-rdkafka';
import { AssignmentCorrectionProducer } from '../producers/assignment-correction-producer';
import { SendMailProducer } from '../producers/send-mail-producer';
import { spawn } from "child_process";

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


  onMessage = (data: AssignmentSubmitEvent['data'], message: Message) => {
    const user = verifyToken(data.user.token);
    const config = data?.configFile || "";
    const source = data?.sourceFile || "";
    this.runPython(config, source, (status: string, result: string) => {
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