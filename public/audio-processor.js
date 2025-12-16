class AudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.targetSampleRate = options.processorOptions?.targetSampleRate || 16000;
        this.bufferSize = options.processorOptions?.bufferSize || 3;
        this.audioBuffer = [];
        this.bufferCount = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const inputData = input[0];

            // Calculate audio level
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += Math.abs(inputData[i]);
            }
            const level = Math.min(1, (sum / inputData.length) * 10);

            // Send audio level
            this.port.postMessage({
                type: 'audioLevel',
                data: level
            });

            // Buffer audio data
            this.audioBuffer.push(new Float32Array(inputData));
            this.bufferCount++;

            if (this.bufferCount >= this.bufferSize) {
                // Combine buffered audio
                const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
                const combinedData = new Float32Array(totalLength);
                let offset = 0;

                for (const buf of this.audioBuffer) {
                    combinedData.set(buf, offset);
                    offset += buf.length;
                }

                // Resample to target sample rate
                const resampledData = this.resampleAudio(combinedData, sampleRate, this.targetSampleRate);

                // Convert to Int16
                const int16Data = this.float32ToInt16(resampledData);

                // Send processed audio
                this.port.postMessage({
                    type: 'audioData',
                    data: int16Data
                });

                // Reset buffer
                this.audioBuffer = [];
                this.bufferCount = 0;
            }
        }

        return true;
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16Array;
    }

    resampleAudio(inputData, sourceSampleRate, targetSampleRate) {
        const resampleRatio = targetSampleRate / sourceSampleRate;
        const targetLength = Math.floor(inputData.length * resampleRatio);
        const resampledData = new Float32Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
            const sourceIndex = i / resampleRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index + 1 < inputData.length) {
                resampledData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
            } else if (index < inputData.length) {
                resampledData[i] = inputData[index];
            } else {
                resampledData[i] = 0;
            }
        }

        return resampledData;
    }
}

registerProcessor('audio-processor', AudioProcessor);