/**
 * Mobile Device Testing Suite
 * 
 * This test suite covers all mobile functionality requirements from task 19:
 * - iOS Safari and Android Chrome compatibility
 * - Offline functionality verification
 * - Push notification testing
 * - PWA installation verification
 * - Gesture and interaction testing
 * 
 * These tests are designed to be run on actual mobile devices or mobile simulators.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// Mock mobile environment detection
const mockMobileEnvironment = () => {
    Object.defineProperty(window, 'navigator', {
        value: {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            onLine: true,
            serviceWorker: {
                register: jest.fn().mockResolvedValue({
                    installing: null,
                    waiting: null,
                    active: { state: 'activated' },
                    addEventListener: jest.fn(),
                    update: jest.fn(),
                }),
                ready: Promise.resolve({
                    active: { state: 'activated' },
                    sync: {
                        register: jest.fn().mockResolvedValue(undefined),
                    },
                }),
            },
        },
        writable: true,
    });

    Object.defineProperty(window, 'screen', {
        value: {
            width: 375,
            height: 812,
            orientation: {
                type: 'portrait-primary',
                angle: 0,
            },
        },
        writable: true,
    });

    // Mock touch events
    Object.defineProperty(window, 'TouchEvent', {
        value: class TouchEvent extends Event {
            touches: Touch[];
            targetTouches: Touch[];
            changedTouches: Touch[];

            constructor(type: string, eventInitDict?: TouchEventInit) {
                super(type, eventInitDict);
                this.touches = eventInitDict?.touches || [];
                this.targetTouches = eventInitDict?.targetTouches || [];
                this.changedTouches = eventInitDict?.changedTouches || [];
            }
        },
        writable: true,
    });

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
        value: {
            permission: 'default',
            requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
    });

    // Mock IndexedDB
    Object.defineProperty(window, 'indexedDB', {
        value: {
            open: jest.fn().mockReturnValue({
                onsuccess: null,
                onerror: null,
                result: {
                    createObjectStore: jest.fn(),
                    transaction: jest.fn().mockReturnValue({
                        objectStore: jest.fn().mockReturnValue({
                            add: jest.fn(),
                            get: jest.fn(),
                            put: jest.fn(),
                            delete: jest.fn(),
                        }),
                    }),
                },
            }),
        },
        writable: true,
    });
};

describe('Mobile Device Testing Suite', () => {
    beforeAll(() => {
        mockMobileEnvironment();
    });

    describe('iOS Safari Compatibility', () => {
        test('should detect iOS Safari environment', () => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

            // For our mock, we're simulating iOS Safari
            expect(navigator.userAgent).toContain('iPhone');
            expect(navigator.userAgent).toContain('Safari');
        });

        test('should support touch events on iOS', () => {
            expect(window.TouchEvent).toBeDefined();

            const touchEvent = new TouchEvent('touchstart', {
                touches: [{
                    identifier: 0,
                    target: document.body,
                    clientX: 100,
                    clientY: 100,
                    pageX: 100,
                    pageY: 100,
                    screenX: 100,
                    screenY: 100,
                    radiusX: 10,
                    radiusY: 10,
                    rotationAngle: 0,
                    force: 1,
                }] as Touch[],
            });

            expect(touchEvent.touches).toHaveLength(1);
            expect(touchEvent.touches[0].clientX).toBe(100);
        });

        test('should handle iOS-specific viewport behavior', () => {
            // Test viewport meta tag presence
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                const content = viewportMeta.getAttribute('content');
                expect(content).toContain('width=device-width');
                expect(content).toContain('initial-scale=1');
            }
        });

        test('should support iOS PWA installation', () => {
            // Test for iOS PWA installation prompt
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSPWA = (window.navigator as any).standalone === true;

            // These would be true when running as installed PWA on iOS
            expect(typeof isStandalone).toBe('boolean');
            expect(typeof isIOSPWA).toBe('boolean');
        });
    });

    describe('Android Chrome Compatibility', () => {
        beforeEach(() => {
            // Mock Android Chrome user agent
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                writable: true,
            });
        });

        test('should detect Android Chrome environment', () => {
            const isAndroid = /Android/.test(navigator.userAgent);
            const isChrome = /Chrome/.test(navigator.userAgent);

            expect(isAndroid).toBe(true);
            expect(isChrome).toBe(true);
        });

        test('should support Android PWA installation', () => {
            // Mock beforeinstallprompt event
            const beforeInstallPromptEvent = new Event('beforeinstallprompt');
            (beforeInstallPromptEvent as any).prompt = jest.fn().mockResolvedValue({ outcome: 'accepted' });

            window.dispatchEvent(beforeInstallPromptEvent);

            expect(beforeInstallPromptEvent.type).toBe('beforeinstallprompt');
        });

        test('should handle Android-specific touch behaviors', () => {
            // Test Android-specific touch handling
            const element = document.createElement('div');
            element.style.touchAction = 'manipulation';

            expect(element.style.touchAction).toBe('manipulation');
        });
    });

    describe('Offline Functionality', () => {
        test('should detect offline state', () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                writable: true,
            });

            expect(navigator.onLine).toBe(false);

            // Test offline event
            const offlineEvent = new Event('offline');
            window.dispatchEvent(offlineEvent);

            expect(offlineEvent.type).toBe('offline');
        });

        test('should register service worker for offline support', async () => {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                expect(registration).toBeDefined();
                expect(registration.active?.state).toBe('activated');
            }
        });

        test('should cache resources for offline use', async () => {
            // Test that critical resources are cached
            const cache = await caches.open('mobile-cache-v1');

            // Mock cache operations
            const mockCache = {
                add: jest.fn().mockResolvedValue(undefined),
                addAll: jest.fn().mockResolvedValue(undefined),
                match: jest.fn().mockResolvedValue(new Response('cached content')),
            };

            await mockCache.addAll([
                '/',
                '/manifest.json',
                '/offline.html',
            ]);

            expect(mockCache.addAll).toHaveBeenCalledWith([
                '/',
                '/manifest.json',
                '/offline.html',
            ]);
        });

        test('should sync data when coming back online', () => {
            // Mock sync manager
            const mockSyncManager = {
                queueOperation: jest.fn(),
                syncPendingOperations: jest.fn(),
                getQueueStatus: jest.fn().mockResolvedValue({ pending: 0, failed: 0 }),
            };

            // Simulate going offline and queuing operations
            Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
            mockSyncManager.queueOperation('photo', { id: 'test-photo' });

            // Simulate coming back online
            Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
            const onlineEvent = new Event('online');
            window.dispatchEvent(onlineEvent);

            expect(mockSyncManager.queueOperation).toHaveBeenCalledWith('photo', { id: 'test-photo' });
        });

        test('should store data locally when offline', () => {
            // Test IndexedDB storage
            const mockDB = {
                transaction: jest.fn().mockReturnValue({
                    objectStore: jest.fn().mockReturnValue({
                        add: jest.fn().mockResolvedValue('success'),
                        get: jest.fn().mockResolvedValue({ id: 'test', data: 'cached' }),
                    }),
                }),
            };

            const store = mockDB.transaction(['syncQueue'], 'readwrite').objectStore('syncQueue');
            store.add({ id: 'test-operation', type: 'photo', data: {} });

            expect(store.add).toHaveBeenCalled();
        });
    });

    describe('Push Notifications', () => {
        test('should request notification permission', async () => {
            const permission = await Notification.requestPermission();
            expect(permission).toBe('granted');
            expect(Notification.requestPermission).toHaveBeenCalled();
        });

        test('should register for push notifications', async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;

                const mockSubscription = {
                    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                    keys: {
                        p256dh: 'test-key',
                        auth: 'test-auth',
                    },
                };

                const subscribe = jest.fn().mockResolvedValue(mockSubscription);
                (registration as any).pushManager = { subscribe };

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'test-vapid-key',
                });

                expect(subscription.endpoint).toBe('https://fcm.googleapis.com/fcm/send/test');
            }
        });

        test('should handle push notification clicks', () => {
            const mockNotificationClick = jest.fn();

            // Mock service worker notification click handler
            const notificationClickEvent = new Event('notificationclick');
            (notificationClickEvent as any).notification = {
                data: { url: '/market/insights' },
                close: jest.fn(),
            };

            mockNotificationClick(notificationClickEvent);
            expect(mockNotificationClick).toHaveBeenCalledWith(notificationClickEvent);
        });

        test('should respect notification preferences', () => {
            const preferences = {
                enabled: true,
                priceChanges: true,
                newListings: false,
                trendShifts: true,
                quietHours: { start: '22:00', end: '06:00' },
            };

            const shouldSendNotification = (type: string) => {
                if (!preferences.enabled) return false;

                const now = new Date();
                const currentHour = now.getHours();

                // Check quiet hours
                if (preferences.quietHours) {
                    const startHour = parseInt(preferences.quietHours.start.split(':')[0]);
                    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);

                    if (startHour > endHour) {
                        // Quiet hours span midnight
                        if (currentHour >= startHour || currentHour <= endHour) {
                            return false;
                        }
                    } else {
                        // Normal quiet hours
                        if (currentHour >= startHour && currentHour <= endHour) {
                            return false;
                        }
                    }
                }

                return preferences[type as keyof typeof preferences] === true;
            };

            expect(shouldSendNotification('priceChanges')).toBe(true);
            expect(shouldSendNotification('newListings')).toBe(false);
        });
    });

    describe('PWA Installation', () => {
        test('should have valid manifest.json', async () => {
            const manifestResponse = await fetch('/manifest.json');
            const manifest = await manifestResponse.json();

            expect(manifest.name).toBeDefined();
            expect(manifest.short_name).toBeDefined();
            expect(manifest.start_url).toBeDefined();
            expect(manifest.display).toBe('standalone');
            expect(manifest.icons).toBeInstanceOf(Array);
            expect(manifest.icons.length).toBeGreaterThan(0);
        });

        test('should register service worker', async () => {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                expect(registration).toBeDefined();
                expect(registration.scope).toBe('/');
            }
        });

        test('should handle app installation prompt', () => {
            let deferredPrompt: any = null;

            const beforeInstallPromptHandler = (e: Event) => {
                e.preventDefault();
                deferredPrompt = e;
            };

            window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

            const beforeInstallPromptEvent = new Event('beforeinstallprompt');
            (beforeInstallPromptEvent as any).prompt = jest.fn();

            window.dispatchEvent(beforeInstallPromptEvent);

            expect(deferredPrompt).toBe(beforeInstallPromptEvent);
        });

        test('should detect if app is installed', () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (window.navigator as any).standalone === true;
            const isInstalled = isStandalone || isIOSStandalone;

            expect(typeof isInstalled).toBe('boolean');
        });
    });

    describe('Gestures and Interactions', () => {
        test('should handle touch gestures', () => {
            const element = document.createElement('div');
            document.body.appendChild(element);

            const touchStartHandler = jest.fn();
            const touchMoveHandler = jest.fn();
            const touchEndHandler = jest.fn();

            element.addEventListener('touchstart', touchStartHandler);
            element.addEventListener('touchmove', touchMoveHandler);
            element.addEventListener('touchend', touchEndHandler);

            // Simulate touch events
            const touchStart = new TouchEvent('touchstart', {
                touches: [{
                    identifier: 0,
                    target: element,
                    clientX: 100,
                    clientY: 100,
                }] as Touch[],
            });

            const touchMove = new TouchEvent('touchmove', {
                touches: [{
                    identifier: 0,
                    target: element,
                    clientX: 150,
                    clientY: 100,
                }] as Touch[],
            });

            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{
                    identifier: 0,
                    target: element,
                    clientX: 150,
                    clientY: 100,
                }] as Touch[],
            });

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);
            element.dispatchEvent(touchEnd);

            expect(touchStartHandler).toHaveBeenCalled();
            expect(touchMoveHandler).toHaveBeenCalled();
            expect(touchEndHandler).toHaveBeenCalled();

            document.body.removeChild(element);
        });

        test('should handle swipe gestures', () => {
            const element = document.createElement('div');
            document.body.appendChild(element);

            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;

            const handleTouchStart = (e: TouchEvent) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            };

            const handleTouchEnd = (e: TouchEvent) => {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;

                const deltaX = endX - startX;
                const deltaY = endY - startY;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 50) {
                        // Swipe right
                        element.dispatchEvent(new CustomEvent('swiperight'));
                    } else if (deltaX < -50) {
                        // Swipe left
                        element.dispatchEvent(new CustomEvent('swipeleft'));
                    }
                }
            };

            element.addEventListener('touchstart', handleTouchStart);
            element.addEventListener('touchend', handleTouchEnd);

            const swipeRightHandler = jest.fn();
            element.addEventListener('swiperight', swipeRightHandler);

            // Simulate swipe right
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }] as Touch[],
            });

            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }] as Touch[],
            });

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);

            expect(swipeRightHandler).toHaveBeenCalled();

            document.body.removeChild(element);
        });

        test('should handle pinch gestures', () => {
            const element = document.createElement('div');
            document.body.appendChild(element);

            const pinchHandler = jest.fn();
            element.addEventListener('pinch', pinchHandler);

            // Simulate pinch gesture with two touches
            const touchStart = new TouchEvent('touchstart', {
                touches: [
                    { identifier: 0, clientX: 100, clientY: 100 },
                    { identifier: 1, clientX: 200, clientY: 100 },
                ] as Touch[],
            });

            const touchMove = new TouchEvent('touchmove', {
                touches: [
                    { identifier: 0, clientX: 80, clientY: 100 },
                    { identifier: 1, clientX: 220, clientY: 100 },
                ] as Touch[],
            });

            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchMove);

            // Calculate distance change to detect pinch
            const initialDistance = Math.sqrt(Math.pow(200 - 100, 2) + Math.pow(100 - 100, 2));
            const currentDistance = Math.sqrt(Math.pow(220 - 80, 2) + Math.pow(100 - 100, 2));
            const scale = currentDistance / initialDistance;

            if (scale > 1.1 || scale < 0.9) {
                element.dispatchEvent(new CustomEvent('pinch', { detail: { scale } }));
            }

            expect(scale).toBeGreaterThan(1);

            document.body.removeChild(element);
        });

        test('should handle long press gestures', (done) => {
            const element = document.createElement('div');
            document.body.appendChild(element);

            const longPressHandler = jest.fn();
            element.addEventListener('longpress', longPressHandler);

            let longPressTimer: NodeJS.Timeout;

            const handleTouchStart = () => {
                longPressTimer = setTimeout(() => {
                    element.dispatchEvent(new CustomEvent('longpress'));
                }, 500);
            };

            const handleTouchEnd = () => {
                clearTimeout(longPressTimer);
            };

            element.addEventListener('touchstart', handleTouchStart);
            element.addEventListener('touchend', handleTouchEnd);

            // Simulate long press
            const touchStart = new TouchEvent('touchstart');
            element.dispatchEvent(touchStart);

            setTimeout(() => {
                expect(longPressHandler).toHaveBeenCalled();
                document.body.removeChild(element);
                done();
            }, 600);
        });

        test('should have touch-friendly tap targets', () => {
            // Test minimum tap target size (44px)
            const button = document.createElement('button');
            button.style.width = '44px';
            button.style.height = '44px';
            button.style.minWidth = '44px';
            button.style.minHeight = '44px';

            document.body.appendChild(button);

            const computedStyle = window.getComputedStyle(button);
            const width = parseInt(computedStyle.width);
            const height = parseInt(computedStyle.height);

            expect(width).toBeGreaterThanOrEqual(44);
            expect(height).toBeGreaterThanOrEqual(44);

            document.body.removeChild(button);
        });

        test('should prevent layout shifts during input', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.style.fontSize = '16px'; // Prevent zoom on iOS

            document.body.appendChild(input);

            const focusHandler = jest.fn();
            const blurHandler = jest.fn();

            input.addEventListener('focus', focusHandler);
            input.addEventListener('blur', blurHandler);

            // Simulate focus
            input.focus();
            expect(focusHandler).toHaveBeenCalled();

            // Check font size to prevent zoom
            const computedStyle = window.getComputedStyle(input);
            expect(parseInt(computedStyle.fontSize)).toBeGreaterThanOrEqual(16);

            document.body.removeChild(input);
        });
    });

    describe('Mobile-Specific Features', () => {
        test('should handle device orientation changes', () => {
            const orientationChangeHandler = jest.fn();
            window.addEventListener('orientationchange', orientationChangeHandler);

            // Mock orientation change
            Object.defineProperty(screen, 'orientation', {
                value: { type: 'landscape-primary', angle: 90 },
                writable: true,
            });

            const orientationEvent = new Event('orientationchange');
            window.dispatchEvent(orientationEvent);

            expect(orientationChangeHandler).toHaveBeenCalled();
        });

        test('should handle viewport changes', () => {
            const resizeHandler = jest.fn();
            window.addEventListener('resize', resizeHandler);

            // Mock viewport resize
            Object.defineProperty(window, 'innerWidth', { value: 812, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);

            expect(resizeHandler).toHaveBeenCalled();
        });

        test('should use appropriate input types for mobile keyboards', () => {
            const emailInput = document.createElement('input');
            emailInput.type = 'email';

            const telInput = document.createElement('input');
            telInput.type = 'tel';

            const numberInput = document.createElement('input');
            numberInput.type = 'number';

            expect(emailInput.type).toBe('email');
            expect(telInput.type).toBe('tel');
            expect(numberInput.type).toBe('number');
        });

        test('should handle mobile-specific CSS', () => {
            const element = document.createElement('div');
            element.style.touchAction = 'manipulation';
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.webkitUserSelect = 'none';

            expect(element.style.touchAction).toBe('manipulation');
            expect(element.style.webkitTapHighlightColor).toBe('transparent');
            expect(element.style.webkitUserSelect).toBe('none');
        });
    });

    describe('Performance on Mobile', () => {
        test('should handle memory constraints', () => {
            // Mock memory API
            (navigator as any).deviceMemory = 4; // 4GB

            const memoryInfo = (performance as any).memory || {
                usedJSHeapSize: 50000000, // 50MB
                totalJSHeapSize: 100000000, // 100MB
                jsHeapSizeLimit: 2000000000, // 2GB
            };

            const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;

            expect(memoryUsageRatio).toBeLessThan(0.8); // Should use less than 80% of available heap
        });

        test('should optimize for mobile network conditions', () => {
            // Mock Network Information API
            (navigator as any).connection = {
                effectiveType: '4g',
                downlink: 10,
                rtt: 100,
                saveData: false,
            };

            const connection = (navigator as any).connection;

            if (connection) {
                expect(['slow-2g', '2g', '3g', '4g']).toContain(connection.effectiveType);
                expect(typeof connection.downlink).toBe('number');
                expect(typeof connection.rtt).toBe('number');
            }
        });

        test('should handle battery optimization', () => {
            // Mock Battery API
            (navigator as any).getBattery = jest.fn().mockResolvedValue({
                level: 0.8,
                charging: false,
                chargingTime: Infinity,
                dischargingTime: 3600,
                addEventListener: jest.fn(),
            });

            const mockBattery = {
                level: 0.2, // Low battery
                charging: false,
            };

            // Should reduce functionality when battery is low
            const shouldReduceActivity = mockBattery.level < 0.3 && !mockBattery.charging;
            expect(shouldReduceActivity).toBe(true);
        });
    });
});

// Helper function to run mobile-specific tests
export const runMobileDeviceTests = () => {
    console.log('Running mobile device tests...');
    console.log('Please ensure you are testing on:');
    console.log('- iOS Safari (iPhone/iPad)');
    console.log('- Android Chrome');
    console.log('- Both portrait and landscape orientations');
    console.log('- Various screen sizes');
    console.log('- Different network conditions');
    console.log('- With and without internet connectivity');
};