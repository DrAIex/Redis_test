import { generateRandomNumber } from '../src/utils/randomGenerator';

describe('Random Number Generator', () => {
  test('should generate a number in the correct range', () => {
    const max = 100;
    for (let i = 0; i < 1000; i++) {
      const num = generateRandomNumber(max);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(max);
    }
  });

  test('should generate a set of unique numbers over time', () => {
    const max = 20;
    const uniqueNumbers = new Set<number>();
    
    for (let i = 0; i < 1000; i++) {
      uniqueNumbers.add(generateRandomNumber(max));
      if (uniqueNumbers.size === max + 1) break;
    }
    
    expect(uniqueNumbers.size).toBeGreaterThan(max / 2);
  });
}); 