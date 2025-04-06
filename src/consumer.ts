import fs from 'fs/promises';
import { connectRedis, disconnectRedis, redisClient } from './redis-client';
import { config } from './config';

interface QueueItem {
  number: number;
  timestamp: number;
  producer: number;
}

interface Result {
  timeSpent: number;
  numbersGenerated: number[];
  metrics: {
    totalMessagesProcessed: number;
    duplicatesCount: number;
    processingRate: number;
    completionPercentage: number;
  };
}

export const startConsumer = async () => {
  const uniqueNumbers = new Map<number, QueueItem>();
  
  const startTime = Date.now();
  
  let totalMessagesProcessed = 0;
  let duplicatesCount = 0;
  
  try {
    console.log('Потребитель запущен');
    
    let processing = true;
    let emptyCount = 0;
    const maxEmptyCount = 10;
    
    while (processing) {
      try {
        const item = await redisClient.rPop(config.redis.queueName);
        
        if (item) {
          totalMessagesProcessed++;
          const queueItem: QueueItem = JSON.parse(item);
          emptyCount = 0;
          
          if (!uniqueNumbers.has(queueItem.number)) {
            uniqueNumbers.set(queueItem.number, queueItem);
            
            if (uniqueNumbers.size % 10 === 0) {
              const completionPercent = (uniqueNumbers.size / (config.app.numbersRange + 1) * 100).toFixed(2);
              console.log(`Прогресс: ${uniqueNumbers.size}/${config.app.numbersRange + 1} (${completionPercent}%) уникальных чисел`);
            }
          } else {
            duplicatesCount++;
          }
          
          if (uniqueNumbers.size === config.app.numbersRange + 1) {
            processing = false;
            console.log('Все возможные числа в диапазоне были сгенерированы');
          }
        } else {
          emptyCount++;
          
          if (emptyCount >= maxEmptyCount) {
            const missingNumbersCount = (config.app.numbersRange + 1) - uniqueNumbers.size;
            if (missingNumbersCount > 0) {
              console.log(`Очередь пуста ${maxEmptyCount} раз подряд. Не найдено ${missingNumbersCount} чисел из диапазона.`);
            }
            processing = false;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error('Ошибка при обработке элемента из очереди:', err);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const timeSpent = Date.now() - startTime;
    const processingRate = totalMessagesProcessed / (timeSpent / 1000);
    const completionPercentage = (uniqueNumbers.size / (config.app.numbersRange + 1)) * 100;
    
    const result: Result = {
      timeSpent,
      numbersGenerated: Array.from(uniqueNumbers.keys()).sort((a, b) => a - b),
      metrics: {
        totalMessagesProcessed,
        duplicatesCount,
        processingRate,
        completionPercentage
      }
    };
    
    try {
      await fs.writeFile(
        config.app.resultFile,
        JSON.stringify(result, null, 2),
        'utf-8'
      );
      
      console.log(`Результат сохранен в файл ${config.app.resultFile}`);
      console.log(`Обработано ${uniqueNumbers.size} уникальных чисел за ${timeSpent} мс`);
      console.log(`Метрики: всего сообщений - ${totalMessagesProcessed}, дубликатов - ${duplicatesCount}`);
      console.log(`Скорость обработки: ${processingRate.toFixed(2)} сообщений/сек`);
      
      return result;
    } catch (error) {
      console.error('Ошибка при сохранении результата:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка в работе потребителя:', error);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectRedis();
      await startConsumer();
    } catch (error) {
      console.error('Критическая ошибка:', error);
      process.exit(1);
    } finally {
      await disconnectRedis();
    }
  })();
} 