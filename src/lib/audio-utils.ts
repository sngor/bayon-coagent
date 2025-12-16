export const DEFAULT_AUDIO_CONFIG = {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    bufferSize: 3,
    minChunkSize: 120, // 5ms at 24kHz
} as const;

export function float32ToInt16(float32Array: Float32Array): Int16Array {
    if (!float32Array || float32Array.length === 0) {
        return new Int16Array(0);
    }

    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

export function combineAudioBuffers(buffers: Float32Array[]): Float32Array {
    if (!buffers || buffers.length === 0) {
        return new Float32Array(0);
    }

    // Filter out empty buffers for better performance
    const validBuffers = buffers.filter(buf => buf && buf.length > 0);
    if (validBuffers.length === 0) {
        return new Float32Array(0);
    }

    const totalLength = validBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const combinedData = new Float32Array(totalLength);
    let offset = 0;

    for (const buf of validBuffers) {
        combinedData.set(buf, offset);
        offset += buf.length;
    }

    return combinedData;
}

export function resampleAudio(
    inputData: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
): Float32Array {
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

export function calculateAudioLevel(audioData: Float32Array): number {
    if (!audioData || audioData.length === 0) {
        return 0;
    }

    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
        sum += Math.abs(audioData[i]);
    }
    return Math.min(1, (sum / audioData.length) * 10);
}

export function audioToBase64(int16Data: Int16Array): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const blob = new Blob([int16Data.buffer as ArrayBuffer], {
                type: 'application/octet-stream'
            });
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch (error) {
            reject(error);
        }
    });
}

export function getMicrophoneErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
        return 'Microphone access denied. Click the lock icon (🔒) in your address bar and set Microphone to "Allow", then refresh the page.';
    } else if (error.name === 'NotFoundError') {
        return 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotReadableError') {
        return 'Microphone is already in use by another application. Close other apps using the microphone and try again.';
    } else if (error.name === 'OverconstrainedError') {
        return 'Microphone does not meet the required specifications. Try using a different microphone.';
    } else if (error.name === 'SecurityError') {
        return 'Microphone access blocked due to security restrictions. Check your browser and system microphone permissions.';
    }
    return error.message || 'Failed to access microphone';
}