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
  readonly tmpPath = 'tmp';

  runPython = (config: string, source: string) => {
    return new Promise<{ status: string, result: string }>((resolve, reject) => {
      const pythonProcess = spawn(this.pythonExecutable, [
        this.pythonScriptPath,
        source,
        config
      ]);
      pythonProcess.stdout.setEncoding("utf8");
      pythonProcess.stdout.on("data", (data) => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: response.status,
            result: response.result
          });
        } catch (err) {
          reject(err);
        }
      });
    })
  }

  createSubmissionDir = (submissionId: string) => {
    const submissionPath = `${this.tmpPath}/${submissionId}`;
    fs.mkdirSync(submissionPath, { recursive: true });
    return submissionPath;
  }

  saveFile = async (key: string, parentDir: string) => {
    const object = await getObject(key);
    const filename = path.basename(key);
    const localPath = path.join(parentDir, filename);
    fs.writeFileSync(localPath, object.Body as Buffer);
    return localPath;
  }

  initDirs = async (submissionId: string, configFile: string, sourceFile: string) => {
    const submissionPath = this.createSubmissionDir(submissionId);
    const configPath = await this.saveFile(configFile, submissionPath);
    const sourcePath = await this.saveFile(sourceFile, submissionPath);

    return { configPath, sourcePath };
  }

  cleanup = (submissionId: string) => {
    const submissionPath = `${this.tmpPath}/${submissionId}`;
    fs.rmdirSync(submissionPath, { recursive: true });
  }

  onMessage = async (data: AssignmentSubmitEvent['data'], message: Message) => {
    // return early if not config file in assignment
    if (!data.configFile) { return; }

    const user = verifyToken(data.user.token);
    const {
      configPath,
      sourcePath
    } = await this.initDirs(data.submissionId, data.configFile, data.sourceFile);

    const { status, result } = await this.runPython(configPath, sourcePath);
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

    this.cleanup(data.submissionId);
  }

}