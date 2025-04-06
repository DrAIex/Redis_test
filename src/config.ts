import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    queueName: process.env.REDIS_QUEUE_NAME || 'number_queue',
  },
  app: {
    producersCount: parseInt(process.env.PRODUCERS_COUNT || '5', 10),
    numbersRange: parseInt(process.env.NUMBERS_RANGE || '100', 10),
    resultFile: path.resolve(process.cwd(), process.env.RESULT_FILE || 'result.json'),
  },
}; 