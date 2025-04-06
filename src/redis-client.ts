import { createClient } from 'redis';
import { config } from './config';

export const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Превышено максимальное количество попыток подключения к Redis');
        return new Error('Превышено максимальное количество попыток подключения');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Ошибка Redis:', err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Подключено к Redis!');
    return redisClient;
  } catch (error) {
    console.error('Ошибка подключения к Redis:', error);
    process.exit(1);
  }
};

export const disconnectRedis = async () => {
  try {
    await redisClient.disconnect();
    console.log('Отключено от Redis.');
  } catch (error) {
    console.error('Ошибка при отключении от Redis:', error);
  }
}; 