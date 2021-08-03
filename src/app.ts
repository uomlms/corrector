import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser, kafka } from '@uomlms/common';
import { AssignmentSubmitConsumer } from './kafka/consumers/assignment-submit-consumer';

const startConsumers = async () => {
  await kafka.connectConsumer(process.env.KAFKA_URL!, process.env.KAFKA_GROUP_ID!);
  new AssignmentSubmitConsumer(kafka.consumer).subscribe();
}

const app = express();
app.set('trust proxy', true);
app.use(express.json());

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);

app.use(currentUser);

app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);
startConsumers();

export { app };
