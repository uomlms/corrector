import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// declares signup function to global object
declare global {
  namespace NodeJS {
    interface Global {
      signup(role?: string): string[]
      generateId(): string
    }
  }
}

let mongo: any;

// runs before all the test start
beforeAll(async () => {
  process.env.JWT_SECRET = 'asdfsg';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// before every test run
beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// runs after all the test finish
afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signup = (role: string = "student") => {
  // Build a JWT payload.  { id, email, role }
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
    role
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_SECRET!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`express:sess=${base64}`];
}

global.generateId = () => {
  return new mongoose.Types.ObjectId().toHexString();
}