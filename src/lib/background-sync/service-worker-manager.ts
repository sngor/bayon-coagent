/**
 * Service Worker Management
 * Handles registration, updates, and communication with service workers
 */

export interface ServiceWorkerStatus {
  registered: boolean;
  active: boolean;
  scope?: string;
  updateFound?: boolean;
}

export class ServiceWorkerManager {
  private registration?: ServiceWorkerRegistration;
  private messageHandlers = new Set<(event: MessageEvent) => void>();

  constructor(private serviceWorkerPath: string) {}

  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.serviceWorkerPath);
      this.setupMessageListener();
      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  private setupMessageListener(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.messageHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in service worker message handler:', error);
        }
      });
    });
  }

  addMessageHandler(handler: (event: MessageEvent) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  async getStatus(): Promise<ServiceWorkerStatus> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        return { registered: false, active: false };
      }

      return {
        registered: true,
        active: !!registration.active,
        scope: registration.scope,
        updateFound: !!registration.waiting
      };
    } catch (error) {
      console.error('Failed to get service worker status:', error);
      return { registered: false, active: false };
    }
  }

  async update(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.warn('No Service Worker registration found');
        return false;
      }

      await registration.update();
      console.log('Service Worker update check completed');
      return true;
    } catch (error) {
      console.error('Failed to update Service Worker:', error);
      return false;
    }
  }

  getRegistration(): ServiceWorkerRegistration | undefined {
    return this.registration;
  }

  destroy(): void {
    this.messageHandlers.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.setupMessageListener);
    }
  }
}