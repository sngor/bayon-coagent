// Simple test to debug the failing case
import { CircuitBreaker, CircuitState } from '../lambda/utils/circuit-breaker';

describe('Debug Circuit Breaker', () => {
    it('should handle the failing counter-example', async () => {
        const options = {
            failureThreshold: 1,
            recoveryTimeoutMs: 1000,
            successThreshold: 1,
            requestTimeoutMs: 1000
        };

        const circuitBreaker = new CircuitBreaker('test-service', options);
        const outcomes = [false]; // One failure

        console.log('Initial state:', circuitBreaker.getState());

        let cascadingFailuresPrevented = 0;
        let actualServiceFailures = 0;
        let successfulOperations = 0;

        for (const shouldSucceed of outcomes) {
            console.log(`Processing outcome: ${shouldSucceed}`);

            try {
                const result = await circuitBreaker.execute(async () => {
                    if (!shouldSucceed) {
                        throw new Error('Simulated service failure');
                    }
                    return 'success';
                });

                console.log('Success:', result);
                successfulOperations++;
            } catch (error) {
                const err = error as Error;
                console.log('Error caught:', err.name, err.message);

                if (err.name === 'CircuitBreakerError') {
                    cascadingFailuresPrevented++;
                    console.log('Circuit breaker prevented execution');
                } else if (err.message === 'Simulated service failure') {
                    actualServiceFailures++;
                    console.log('Actual service failure');
                }
            }

            console.log('State after operation:', circuitBreaker.getState());
        }

        console.log('Final results:');
        console.log('successfulOperations:', successfulOperations);
        console.log('actualServiceFailures:', actualServiceFailures);
        console.log('cascadingFailuresPrevented:', cascadingFailuresPrevented);
        console.log('Total operations:', successfulOperations + actualServiceFailures + cascadingFailuresPrevented);
        console.log('Expected total:', outcomes.length);

        // The assertion that might be failing
        const totalOperations = successfulOperations + actualServiceFailures + cascadingFailuresPrevented;
        expect(totalOperations).toBe(outcomes.length);
    });
});