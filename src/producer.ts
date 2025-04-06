import { connectRedis, disconnectRedis, redisClient } from './redis-client';
import { config } from './config';
import { generateRandomNumber } from './utils/randomGenerator';

export const startProducer = async (producerId: number) => {
  let generatedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();
  
  try {
    console.log(`Производитель ${producerId} запущен`);

    const totalNumbers = Math.max(
      config.app.numbersRange * 3,
      Math.ceil(config.app.numbersRange / config.app.producersCount) * 5
    );
    
    for (let i = 0; i < totalNumbers; i++) {
      try {
        const number = generateRandomNumber(config.app.numbersRange);
        
        const data = JSON.stringify({
          number,
          timestamp: Date.now(),
          producer: producerId
        });
        
        await redisClient.lPush(config.redis.queueName, data);
        generatedCount++;
        
        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 1));
      } catch (err) {
        errorCount++;
        console.error(`Производитель ${producerId}: ошибка при отправке данных:`, err);
        
        if (errorCount > 10) {
          console.error(`Производитель ${producerId}: превышено допустимое количество ошибок`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const timeSpent = Date.now() - startTime;
    const rate = generatedCount / (timeSpent / 1000);
    
    console.log(`Производитель ${producerId} завершил работу: сгенерировано ${generatedCount} чисел за ${timeSpent} мс`);
    console.log(`Скорость генерации: ${rate.toFixed(2)} чисел/сек`);
  } catch (error) {
    console.error(`Ошибка в работе производителя ${producerId}:`, error);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectRedis();
      const producerId = parseInt(process.argv[2] || '1', 10);
      await startProducer(producerId);
    } catch (error) {
      console.error('Критическая ошибка производителя:', error);
      process.exit(1);
    } finally {
      await disconnectRedis();
    }
  })();
} 