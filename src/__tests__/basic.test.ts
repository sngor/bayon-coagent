/**
 * Basic test to ensure Jest is working properly
 * Tests fundamental Jest functionality and project setup
 */

describe('Basic Tests', () => {
    test('should pass basic arithmetic test', () => {
        expect(1 + 1).toBe(2);
    });

    test('should handle async operations', async () => {
        const result = await Promise.resolve('test');
        expect(result).toBe('test');
    });

    test('should work with objects', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj).toEqual({ name: 'test', value: 42 });
    });

    test('should handle arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    test('should handle error cases', () => {
        expect(() => {
            throw new Error('Test error');
        }).toThrow('Test error');
    });

    test('should validate TypeScript types', () => {
        interface TestInterface {
            id: string;
            count: number;
        }

        const testObj: TestInterface = { id: 'test-123', count: 5 };
        expect(testObj.id).toBe('test-123');
        expect(typeof testObj.count).toBe('number');
    });
});