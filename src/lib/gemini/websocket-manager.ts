import { GeminiLiveConfig } from '@/hooks/use-gemini-live';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export class WebSocketManager {
    private ws: WebSocket | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 5000;

    constructor(
        private onConnectionStateChange: (state: ConnectionState) => void,
        private onError: (error: string) => void,
        private onMessage: (data: any) => void
    ) { }

    async connect(apiKey: string, config?: GeminiLiveConfig): Promise<void> {
        try {
            this.onError('');
            this.onConnectionStateChange('connecting');

            await this.createConnection(apiKey, config);
        } catch (err: any) {
            console.error('❌ Failed to connect to Gemini Live:', err);
            this.onError(err.message || 'Failed to connect');
            this.onConnectionStateChange('error');
        }
    }

    private async createConnection(apiKey: string, config?: GeminiLiveConfig): Promise<void> {
        // Clean up existing connection
        this.cleanup();

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        const ws = new WebSocket(url);
        this.ws = ws;

        return new Promise((resolve, reject) => {
            ws.onopen = () => {
                console.log('✅ Gemini Live WebSocket connected successfully');
                this.onConnectionStateChange('connected');
                this.onError('');
                this.reconnectAttempts = 0;
                this.sendSetupMessage(config);
                resolve();
            };

            ws.onmessage = async (event) => {
                try {
                    const data = event.data instanceof Blob
                        ? JSON.parse(await event.data.text())
                        : JSON.parse(event.data);

                    this.onMessage(data);
                } catch (e) {
                    console.error('❌ Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('❌ Gemini Live WebSocket error:', e);
                this.onConnectionStateChange('error');
                this.onError('Connection error occurred. Will attempt to reconnect...');
                reject(e);
            };

            ws.onclose = (e) => {
                console.log('🔌 Gemini Live WebSocket closed');
                this.onConnectionStateChange('disconnected');

                if (e.code !== 1000) {
                    const errorMessage = this.getCloseErrorMessage(e.code);
                    this.onError(errorMessage);

                    if (e.code !== 4001 && e.code !== 4003) {
                        this.scheduleReconnect(apiKey, config);
                    }
                }
            };
        });
    }

    private sendSetupMessage(config?: GeminiLiveConfig): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const modelToUse = config?.model || 'models/gemini-2.5-flash-native-audio-preview-12-2025';
        const setupMessage = {
            setup: {
                model: modelToUse,
                generationConfig: {
                    responseModalities: config?.responseModalities || ['AUDIO'],
                    speechConfig: config?.voiceName ? {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: config.voiceName,
                            },
                        },
                    } : undefined,
                },
                systemInstruction: config?.systemInstruction ? {
                    parts: [{ text: config.systemInstruction }]
                } : undefined,
            }
        };

        console.log('📤 Sending setup message to Gemini Live');
        this.ws.send(JSON.stringify(setupMessage));
    }

    private getCloseErrorMessage(code: number): string {
        switch (code) {
            case 1006:
                return 'Connection lost. Network connection interrupted.';
            case 4001:
                return 'Connection lost. Invalid API key or authentication failed.';
            case 4003:
                return 'Connection lost. API quota exceeded or rate limited.';
            default:
                return `Connection lost. Error code: ${code}`;
        }
    }

    private scheduleReconnect(apiKey: string, config?: GeminiLiveConfig): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onError('Connection failed after multiple attempts. Please check your API key and try again.');
            return;
        }

        this.reconnectAttempts += 1;
        this.onError(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect(apiKey, config);
        }, this.reconnectDelay);
    }

    send(message: any): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        this.ws.send(JSON.stringify(message));
        return true;
    }

    disconnect(): void {
        this.cleanup();
        this.onConnectionStateChange('disconnected');
    }

    private cleanup(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            try {
                this.ws.close(1000, 'Manual disconnect');
            } catch (e) {
                console.warn('Error closing WebSocket:', e);
            }
            this.ws = null;
        }
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}