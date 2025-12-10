// Clear service worker script
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
            console.log('Service worker unregistered:', registration);
        }
    });
}

// Clear all caches
if ('caches' in window) {
    caches.keys().then(function (names) {
        for (let name of names) {
            caches.delete(name);
            console.log('Cache deleted:', name);
        }
    });
}

console.log('Service worker and caches cleared');