import { app } from './app';
import dotenv from 'dotenv';
import { resolve } from "path"

dotenv.config({ path: resolve(__dirname, "../config/config.env") });

const start = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined');
  }
  if (!process.env.KAFKA_URL) {
    throw new Error('KAFKA_URL must be defined');
  }
  if (!process.env.KAFKA_GROUP_ID) {
    throw new Error('KAFKA_GROUP_ID must be defined');
  }

  app.listen(process.env.PORT, () => {
    console.log('Listening on port 3000');
  });
};

start();