interface RedisMockModule {
  redisClient: {
    connect: jest.Mock;
    disconnect: jest.Mock;
    on: jest.Mock;
    lPush: jest.Mock;
    rPop: jest.Mock;
    del: jest.Mock;
  };
  connectRedis: () => Promise<any>;
  disconnectRedis: () => Promise<void>;
}

jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    lPush: jest.fn().mockResolvedValue(1),
    rPop: jest.fn().mockResolvedValue('{"number":42,"timestamp":1627123456789,"producer":1}'),
    del: jest.fn().mockResolvedValue(1)
  };
  
  return {
    createClient: jest.fn(() => mockClient)
  };
});

describe('Redis Client', () => {
  let redisModule: RedisMockModule;
  
  beforeEach(() => {
    jest.resetModules();
    redisModule = require('../src/redis-client');
  });
  
  test('connectRedis должен подключаться к Redis', async () => {
    await redisModule.connectRedis();
    expect(redisModule.redisClient.connect).toHaveBeenCalled();
  });
  
  test('disconnectRedis должен отключаться от Redis', async () => {
    await redisModule.disconnectRedis();
    expect(redisModule.redisClient.disconnect).toHaveBeenCalled();
  });
}); 