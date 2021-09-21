import { Consumer, AssignmentSubmitEvent, Topics, kafka, verifyToken, getObject } from '@uomlms/common';
import path from 'path';
import fs from 'fs';
import { spawn } from "child_process";

const tmpPath = 'tmp';
const pythonScriptPath = './src/python/corrector.py';
const pythonExecutable = 'python3';

const createSubmissionDir = (submissionId: string) => {
  const submissionPath = `${tmpPath}/${submissionId}`;
  fs.mkdirSync(submissionPath, { recursive: true });
  return submissionPath;
}

const saveFile = async (key: string, parentDir: string) => {
  const object = await getObject(key);
  const filename = path.basename(key);
  const localPath = path.join(parentDir, filename);
  fs.writeFileSync(localPath, object.Body as Buffer);
  return localPath;
}

const initDirs = async (submissionId: string, configFile: string, sourceFile: string) => {
  const submissionPath = createSubmissionDir(submissionId);
  const configPath = await saveFile(configFile, submissionPath);
  const sourcePath = await saveFile(sourceFile, submissionPath);

  return { configPath, sourcePath };
}

const cleanup = (submissionId: string) => {
  const submissionPath = `${tmpPath}/${submissionId}`;
  fs.rmdirSync(submissionPath, { recursive: true });
}

const runPython = (config: string, source: string) => {
  return new Promise<{ status: string, result: string }>((resolve, reject) => {
    const pythonProcess = spawn(pythonExecutable, [
      pythonScriptPath,
      config,
      source
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
        console.log(`Response from corrector script is not a valid JSON string. Error Stack: ${err}`);
        reject(err);
      }
    });
    pythonProcess.stderr.on("data", (err) => {
      console.log(`Stderr from corrector script. Error: ${err}`);
      reject(err);
    });
  })
}

export const correctAssignment = async (submissionId: string, config: string, source: string) => {
  const {
    configPath,
    sourcePath
  } = await initDirs(submissionId, config, source);

  try {
    const { status, result } = await runPython(configPath, sourcePath);
    cleanup(submissionId);
    return { status, result };
  } catch (err) {
    return {
      status: "fail",
      result: "Unexpected error occured"
    }
  }
}

