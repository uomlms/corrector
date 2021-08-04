import { app } from './app';
import dotenv from 'dotenv';
import { resolve } from "path"
import { kafka } from '@uomlms/common';
import { AssignmentSubmitConsumer } from './kafka/consumers/assignment-submit-consumer';

dotenv.config({ path: resolve(__dirname, "../config/config.env") });

const startConsumers = async () => {
  await kafka.connectConsumer(process.env.KAFKA_URL!, process.env.KAFKA_GROUP_ID!);
  new AssignmentSubmitConsumer(kafka.consumer).subscribe();
}

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

  await kafka.connectProducer(
    process.env.KAFKA_URL,
  );

  process.on('SIGINT', () => kafka.producer.disconnect());
  process.on('SIGTERM', () => kafka.producer.disconnect());

  await startConsumers();

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

start();