// Audio performance optimizations
export class AudioBufferManager {
    private buffers: Int16Array[] = [];
    private maxBufferSize = 10; // Limit buffer size to prevent memory issues
    private isProcessing = false;

    addBuffer(buffer: Int16Array): void {
        // Skip empty or very small buffers
        if (buffer.length < 240) return; // Less than 10ms at 24kHz

        // Prevent buffer overflow
        if (this.buffers.length >= this.maxBufferSize) {
            this.buffers.shift(); // Remove oldest buffer
        }

        this.buffers.push(buffer);
    }

    getNextBuffer(): Int16Array | null {
        return this.buffers.shift() || null;
    }

    getCombinedBuffer(): Int16Array | null {
        if (this.buffers.length === 0) return null;

        const totalLength = this.buffers.reduce((sum, buf) => sum + buf.length, 0);
        const combined = new Int16Array(totalLength);

        let offset = 0;
        for (const buffer of this.buffers) {
            combined.set(buffer, offset);
            offset += buffer.length;
        }

        this.buffers = []; // Clear buffers after combining
        return combined;
    }

    clear(): void {
        this.buffers = [];
        this.isProcessing = false;
    }

    get hasBuffers(): boolean {
        return this.buffers.length > 0;
    }

    get bufferCount(): number {
        return this.buffers.length;
    }
}

// Optimized audio level calculation with debouncing
export class AudioLevelCalculator {
    private lastLevel = 0;
    private smoothingFactor = 0.3;

    calculateLevel(audioData: Float32Array): number {
        let sum = 0;
        const sampleStep = Math.max(1, Math.floor(audioData.length / 1024)); // Sample every nth element for performance

        for (let i = 0; i < audioData.length; i += sampleStep) {
            sum += Math.abs(audioData[i]);
        }

        const rawLevel = Math.min(1, (sum / (audioData.length / sampleStep)) * 5);

        // Smooth the level changes to prevent jittery UI
        this.lastLevel = this.lastLevel * (1 - this.smoothingFactor) + rawLevel * this.smoothingFactor;

        return this.lastLevel;
    }

    reset(): void {
        this.lastLevel = 0;
    }
}

// Connection retry with exponential backoff
export class ConnectionManager {
    private retryCount = 0;
    private maxRetries = 5;
    private baseDelay = 1000;
    private maxDelay = 30000;

    async retry<T>(operation: () => Promise<T>): Promise<T> {
        try {
            const result = await operation();
            this.retryCount = 0; // Reset on success
            return result;
        } catch (error) {
            if (this.retryCount >= this.maxRetries) {
                throw new Error(`Operation failed after ${this.maxRetries} attempts: ${error}`);
            }

            const delay = Math.min(
                this.baseDelay * Math.pow(2, this.retryCount),
                this.maxDelay
            );

            this.retryCount++;

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retry(operation);
        }
    }

    reset(): void {
        this.retryCount = 0;
    }
}