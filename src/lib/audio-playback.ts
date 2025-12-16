import { DEFAULT_AUDIO_CONFIG } from './audio-utils';

export class AudioPlaybackManager {
    private audioContext: AudioContext | null = null;
    private audioBuffer: Int16Array[] = [];
    private audioQueue: AudioBufferSourceNode[] = [];
    private isPlaying = false;
    private nextPlayTime = 0;
    private playbackTimeout: NodeJS.Timeout | null = null;
    private lastChunkTime = 0;

    constructor(
        private onSpeakingChange: (isSpeaking: boolean) => void,
        private onAudioLevelChange: (level: number) => void
    ) { }

    bufferAudioChunk(audioData: Int16Array): void {
        // Skip empty chunks to prevent audio artifacts
        if (audioData.length === 0) {
            return;
        }

        // Add chunk to buffer queue
        this.audioBuffer.push(audioData);
        this.lastChunkTime = Date.now();

        // Clear existing timeout
        if (this.playbackTimeout) {
            clearTimeout(this.playbackTimeout);
        }

        const bufferLength = this.audioBuffer.length;

        // Only start playback if nothing is currently playing
        if (this.isPlaying) {
            return; // Let current audio finish before starting new playback
        }

        // Play with small buffer for low latency but avoid overlaps
        let waitTime = 0;

        if (bufferLength >= 2) {
            // Play immediately with 2+ chunks
            waitTime = 0;
        } else {
            // Single chunk - short wait to accumulate more
            waitTime = 50;
        }

        // Set timeout to play buffered audio
        this.playbackTimeout = setTimeout(() => {
            if (this.audioBuffer.length > 0 && !this.isPlaying) {
                this.playBufferedAudio();
            }
        }, waitTime);
    }

    private async playBufferedAudio(): Promise<void> {
        if (this.audioBuffer.length === 0) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            const audioContext = this.audioContext;

            // Resume audio context if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Take only available chunks to minimize latency
            const chunksToPlay = [...this.audioBuffer];
            this.audioBuffer = []; // Clear immediately

            // Combine chunks into one continuous audio stream
            const totalSamples = chunksToPlay.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Int16Array(totalSamples);
            let offset = 0;

            for (const chunk of chunksToPlay) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            // Skip very small audio chunks that might cause pops or artifacts
            if (combinedAudio.length < DEFAULT_AUDIO_CONFIG.minChunkSize) {
                return;
            }

            // Create audio buffer with proper sample rate (Gemini sends 24kHz)
            const sampleRate = 24000;
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            // Optimized Int16 to Float32 conversion
            for (let i = 0; i < combinedAudio.length; i++) {
                const sample = combinedAudio[i];
                channelData[i] = sample / (sample < 0 ? 32768 : 32767);
            }

            // Calculate output audio level for waveform visualization
            let outputSum = 0;
            for (let i = 0; i < channelData.length; i++) {
                outputSum += Math.abs(channelData[i]);
            }
            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5);
            this.onAudioLevelChange(outputLevel);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Schedule seamless playback
            const currentTime = audioContext.currentTime;
            const startTime = Math.max(currentTime, this.nextPlayTime);

            source.onended = () => {
                // Update next play time for seamless continuation
                this.nextPlayTime = startTime + audioBuffer.duration;

                // Remove this source from queue
                const index = this.audioQueue.indexOf(source);
                if (index > -1) {
                    this.audioQueue.splice(index, 1);
                }

                // Check if this was the last playing source
                if (this.audioQueue.length === 0) {
                    this.isPlaying = false;

                    // Immediately check for more audio
                    if (this.audioBuffer.length > 0) {
                        setTimeout(() => this.playBufferedAudio(), 0);
                    } else {
                        this.onSpeakingChange(false);
                        this.onAudioLevelChange(0);
                        this.nextPlayTime = 0; // Reset for next session
                    }
                }
            };

            // Add to queue and start
            this.audioQueue.push(source);
            this.onSpeakingChange(true);
            this.isPlaying = true;
            source.start(startTime);

            // Update next play time
            this.nextPlayTime = startTime + audioBuffer.duration;

            // Minimal logging
            if (chunksToPlay.length > 5) {
                console.log('🎵 Streaming audio:', combinedAudio.length, 'samples from', chunksToPlay.length, 'chunks');
            }

        } catch (error) {
            console.error('❌ Error playing buffered audio:', error);
            this.cleanup();
        }
    }

    cleanup(): void {
        // Clear timeout
        if (this.playbackTimeout) {
            clearTimeout(this.playbackTimeout);
            this.playbackTimeout = null;
        }

        // Stop all queued audio sources
        this.audioQueue.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                console.warn('Error stopping queued audio source:', e);
            }
        });
        this.audioQueue = [];

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            this.audioContext = null;
        }

        // Reset state
        this.audioBuffer = [];
        this.isPlaying = false;
        this.nextPlayTime = 0;
        this.onSpeakingChange(false);
        this.onAudioLevelChange(0);
    }
}