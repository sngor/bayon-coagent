import { GeminiLiveConfig } from '@/hooks/use-gemini-live';

export class GeminiWebSocketManager {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelay = 5000;

    constructor(
        private onOpen: () => void,
        private onMessage: (data: any) => void,
        private onError: (error: string) => void,
        private onClose: (code: number) => void
    ) { }

    async connect(apiKey: string, config?: GeminiLiveConfig): Promise<void> {
        this.disconnect();

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('✅ Gemini Live WebSocket connected successfully');
            this.reconnectAttempts = 0;
            this.onOpen();
            this.sendSetupMessage(config);
        };

        this.ws.onmessage = async (event) => {
            try {
                let data;
                if (event.data instanceof Blob) {
                    data = JSON.parse(await event.data.text());
                } else {
                    data = JSON.parse(event.data);
                }

                const audioPartsCount = data.serverContent?.modelTurn?.parts?.filter((p: any) =>
                    p.inlineData && p.inlineData.mimeType.startsWith('audio/')
                ).length || 0;

                console.log('📥 Received message from Gemini Live:',
                    data.serverContent ? `Audio response ${audioPartsCount}` : 'Setup response');

                this.onMessage(data);
            } catch (e) {
                console.error('❌ Error parsing WebSocket message:', e);
            }
        };

        this.ws.onerror = (e) => {
            console.error('❌ Gemini Live WebSocket error:', e);
            this.onError('Connection error occurred. Will attempt to reconnect...');
        };

        this.ws.onclose = (e) => {
            console.log('🔌 Gemini Live WebSocket closed');
            this.onClose(e.code);

            if (e.code !== 1000 && this.shouldReconnect(e.code)) {
                this.scheduleReconnect(apiKey, config);
            }
        };
    }

    disconnect(): void {
        this.clearReconnectTimeout();

        if (this.ws) {
            try {
                this.ws.close(1000, 'Manual disconnect');
            } catch (e) {
                console.warn('Error closing WebSocket:', e);
            }
            this.ws = null;
        }
    }

    send(message: any): boolean {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private sendSetupMessage(config?: GeminiLiveConfig): void {
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
        console.log('🤖 Using model:', modelToUse);
        console.log('🔊 Response modalities:', config?.responseModalities || ['AUDIO']);

        this.send(setupMessage);
    }

    private shouldReconnect(code: number): boolean {
        // Don't reconnect on authentication or quota errors
        return code !== 4001 && code !== 4003 && this.reconnectAttempts < this.maxReconnectAttempts;
    }

    private scheduleReconnect(apiKey: string, config?: GeminiLiveConfig): void {
        this.reconnectAttempts += 1;

        this.reconnectTimeout = setTimeout(() => {
            this.connect(apiKey, config);
        }, this.reconnectDelay);
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}