import { fork } from 'child_process';
import path from 'path';
import { connectRedis, disconnectRedis, redisClient } from './redis-client';
import { config } from './config';
import { startConsumer } from './consumer';

const startProducers = async (count: number) => {
  const producers = [];
  
  try {
    await redisClient.del(config.redis.queueName);
    
    for (let i = 1; i <= count; i++) {
      const producer = fork(path.join(__dirname, 'producer.ts'), [i.toString()]);
      
      producers.push(new Promise<void>((resolve, reject) => {
        producer.on('exit', (code) => {
          if (code === 0) {
            console.log(`Производитель ${i} завершил работу успешно`);
            resolve();
          } else {
            console.error(`Производитель ${i} завершил работу с ошибкой, код: ${code}`);
            if (producers.length <= 2) {
              reject(new Error(`Критическая ошибка производителя ${i}`));
            } else {
              resolve();
            }
          }
        });
      }));
    }
    
    await Promise.all(producers);
    console.log('Все производители завершили работу');
  } catch (error) {
    console.error('Ошибка при запуске производителей:', error);
    throw error;
  }
};

const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('Запуск приложения...');
    console.log(`Настройки: Производителей - ${config.app.producersCount}, Диапазон чисел - [0-${config.app.numbersRange}]`);
    
    await connectRedis();
    
    console.log('Запуск производителей...');
    await startProducers(config.app.producersCount);
    
    console.log('Запуск потребителя...');
    const result = await startConsumer();
    
    const totalTime = Date.now() - startTime;
    console.log('Приложение успешно завершило работу');
    console.log(`Общее время выполнения: ${totalTime} мс`);
    console.log(`Сгенерировано ${result.numbersGenerated.length} уникальных чисел за ${result.timeSpent} мс`);
    
  } catch (error) {
    console.error('Ошибка в работе приложения:', error);
    process.exit(1);
  } finally {
    await disconnectRedis();
  }
};

if (require.main === module) {
  main();
} 