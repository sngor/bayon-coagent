/**
 * Audio buffer management utilities for voice features
 * Handles memory-efficient audio processing and playback
 */

export interface AudioBufferConfig {
    maxBufferSize: number;
    sampleRate: number;
    channelCount: number;
    bufferDuration: number; // in milliseconds
}

export class AudioBufferManager {
    private buffers: Int16Array[] = [];
    private maxBufferSize: number;
    private sampleRate: number;
    private channelCount: number;
    private bufferDuration: number;
    private totalSamples = 0;

    constructor(config: AudioBufferConfig) {
        this.maxBufferSize = config.maxBufferSize;
        this.sampleRate = config.sampleRate;
        this.channelCount = config.channelCount;
        this.bufferDuration = config.bufferDuration;
    }

    /**
     * Add audio chunk to buffer with automatic cleanup
     */
    addChunk(audioData: Int16Array): void {
        // Prevent memory bloat by limiting total buffer size
        const maxSamples = (this.sampleRate * this.bufferDuration * this.channelCount) / 1000;

        if (this.totalSamples + audioData.length > maxSamples) {
            this.cleanup();
        }

        this.buffers.push(audioData);
        this.totalSamples += audioData.length;
    }

    /**
     * Get combined audio buffer and clear internal buffers
     */
    getAndClearBuffer(): Int16Array | null {
        if (this.buffers.length === 0) {
            return null;
        }

        const combinedAudio = new Int16Array(this.totalSamples);
        let offset = 0;

        for (const chunk of this.buffers) {
            combinedAudio.set(chunk, offset);
            offset += chunk.length;
        }

        this.clear();
        return combinedAudio;
    }

    /**
     * Check if buffer has enough data for playback
     */
    hasEnoughData(minDurationMs: number = 100): boolean {
        const minSamples = (this.sampleRate * minDurationMs * this.channelCount) / 1000;
        return this.totalSamples >= minSamples;
    }

    /**
     * Get current buffer duration in milliseconds
     */
    getCurrentDuration(): number {
        return (this.totalSamples * 1000) / (this.sampleRate * this.channelCount);
    }

    /**
     * Clear all buffers and reset counters
     */
    clear(): void {
        this.buffers = [];
        this.totalSamples = 0;
    }

    /**
     * Remove oldest buffers to prevent memory bloat
     */
    private cleanup(): void {
        const halfMaxSamples = this.maxBufferSize / 2;
        let removedSamples = 0;

        while (this.totalSamples > halfMaxSamples && this.buffers.length > 0) {
            const removed = this.buffers.shift();
            if (removed) {
                removedSamples += removed.length;
            }
        }

        this.totalSamples -= removedSamples;
    }

    /**
     * Get memory usage statistics
     */
    getStats(): {
        bufferCount: number;
        totalSamples: number;
        durationMs: number;
        memoryUsageKB: number;
    } {
        return {
            bufferCount: this.buffers.length,
            totalSamples: this.totalSamples,
            durationMs: this.getCurrentDuration(),
            memoryUsageKB: (this.totalSamples * 2) / 1024, // Int16 = 2 bytes per sample
        };
    }
}

/**
 * Audio resampling utility for converting between sample rates
 */
export class AudioResampler {
    static resample(
        inputData: Float32Array,
        inputSampleRate: number,
        outputSampleRate: number
    ): Float32Array {
        if (inputSampleRate === outputSampleRate) {
            return inputData;
        }

        const resampleRatio = outputSampleRate / inputSampleRate;
        const outputLength = Math.floor(inputData.length * resampleRatio);
        const outputData = new Float32Array(outputLength);

        // Linear interpolation resampling
        for (let i = 0; i < outputLength; i++) {
            const sourceIndex = i / resampleRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index + 1 < inputData.length) {
                outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
            } else if (index < inputData.length) {
                outputData[i] = inputData[index];
            } else {
                outputData[i] = 0;
            }
        }

        return outputData;
    }

    /**
     * Convert Float32Array to Int16Array with proper scaling
     */
    static float32ToInt16(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);

        for (let i = 0; i < float32Array.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }

        return int16Array;
    }

    /**
     * Convert Int16Array to Float32Array
     */
    static int16ToFloat32(int16Array: Int16Array): Float32Array {
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 32768 : 32767);
        }

        return float32Array;
    }
}