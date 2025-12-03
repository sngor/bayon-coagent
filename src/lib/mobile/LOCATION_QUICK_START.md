# Location Services - Quick Start Guide

## Installation

Location services are already integrated into the mobile library. No additional installation needed.

## Basic Usage

### 1. Import the Service

```typescript
import { locationServices } from "@/lib/mobile";
```

### 2. Request Permission

```typescript
const hasPermission = await locationServices.requestLocationPermission();
if (!hasPermission) {
  // Show permission denied UI
  return;
}
```

### 3. Get Current Location

```typescript
const location = await locationServices.getCurrentLocation();
console.log(location.latitude, location.longitude);
```

### 4. Start Location Tracking

```typescript
// Start tracking for geofencing
locationServices.startLocationTracking();

// Stop when done
locationServices.stopLocationTracking();
```

## Common Use Cases

### Location-Based Reminders

```typescript
// Create reminder for an appointment
const reminder = await locationServices.createLocationReminder(
  appointment,
  500 // radius in meters
);
```

### Proximity Notifications

```typescript
// Setup proximity notification
const notification = await locationServices.setupProximityNotification(
  appointment,
  200 // radius in meters
);
```

### One-Tap Navigation

```typescript
// Open navigation app
locationServices.openNavigation(
  { latitude: 37.7749, longitude: -122.4194 },
  "123 Main St, San Francisco, CA"
);
```

### Arrival Detection

```typescript
// Check if arrived
const hasArrived = await locationServices.detectArrival(appointment, 50);

// Or setup automatic detection
locationServices.setupArrivalDetection(
  appointment,
  (appointment) => {
    // Show arrival UI
  },
  50 // radius in meters
);
```

### Check-In Logging

```typescript
// Log check-in at current location
const checkIn = await locationServices.checkIn(
  userId,
  appointmentId,
  propertyId,
  "Optional notes"
);
```

## React Components

### Location Reminders

```tsx
import { LocationReminderComponent } from "@/components/mobile/location-reminder";

<LocationReminderComponent
  appointments={appointments}
  onNavigate={(appointment) => {
    // Handle navigation
  }}
/>;
```

### Proximity Notifications Setup

```tsx
import { ProximityNotificationSetup } from "@/components/mobile/proximity-notification-setup";

<ProximityNotificationSetup appointments={appointments} />;
```

### Navigation Button

```tsx
import { NavigationButton } from "@/components/mobile/navigation-button";

<NavigationButton
  destination={{ latitude: 37.7749, longitude: -122.4194 }}
  address="123 Main St, San Francisco, CA"
  label="Get Directions"
/>;
```

### Arrival Display

```tsx
import { ArrivalDisplay } from "@/components/mobile/arrival-display";

<ArrivalDisplay
  appointment={appointment}
  onCheckIn={() => {
    // Handle check-in
  }}
/>;
```

### Check-In Logger

```tsx
import { CheckInLogger } from "@/components/mobile/check-in-logger";

<CheckInLogger
  userId={userId}
  appointmentId={appointmentId}
  propertyId={propertyId}
  onCheckInComplete={(checkIn) => {
    // Handle completed check-in
  }}
/>;
```

## Geofencing

### Add Geofence

```typescript
locationServices.addGeofence({
  id: "unique-id",
  location: { latitude: 37.7749, longitude: -122.4194 },
  radius: 200, // meters
  appointmentId: "apt-1",
  onEnter: () => {
    console.log("Entered geofence");
  },
  onExit: () => {
    console.log("Exited geofence");
  },
});
```

### Remove Geofence

```typescript
locationServices.removeGeofence("unique-id");
```

### Clear All Geofences

```typescript
locationServices.clearGeofences();
```

## Utility Functions

### Calculate Distance

```typescript
const distance = locationServices.calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 }
);
console.log(`Distance: ${distance}m`);
```

### Format Distance

```typescript
const formatted = locationServices.formatDistance(1500);
console.log(formatted); // "1.5km"
```

### Check Availability

```typescript
if (locationServices.isLocationAvailable()) {
  // Location services available
}
```

## Error Handling

```typescript
try {
  const location = await locationServices.getCurrentLocation();
} catch (error) {
  if (error.message.includes("permission denied")) {
    // Show permission request UI
  } else if (error.message.includes("timeout")) {
    // Show retry option
  } else {
    // Show generic error
  }
}
```

## Best Practices

### 1. Request Permission Early

Request location permission when the user first needs a location feature, not on app startup.

### 2. Stop Tracking When Not Needed

Always stop location tracking when it's no longer needed to save battery:

```typescript
useEffect(() => {
  locationServices.startLocationTracking();
  return () => {
    locationServices.stopLocationTracking();
  };
}, []);
```

### 3. Handle Permission Denial

Always provide fallback UI when permission is denied:

```typescript
const hasPermission = await locationServices.requestLocationPermission();
if (!hasPermission) {
  return <PermissionDeniedUI />;
}
```

### 4. Use Appropriate Radius

Choose geofence radius based on use case:

- **Arrival detection**: 50m
- **Proximity notifications**: 200m
- **Location reminders**: 500m

### 5. Clean Up Geofences

Remove geofences when they're no longer needed:

```typescript
useEffect(() => {
  const geofenceId = 'my-geofence';
  locationServices.addGeofence({...});

  return () => {
    locationServices.removeGeofence(geofenceId);
  };
}, []);
```

## Demo

See the full demo at `/mobile/location`:

```
http://localhost:3000/mobile/location
```

## Documentation

For complete documentation, see:

- `LOCATION_SERVICES_README.md` - Full API reference
- `TASK_13_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `LOCATION_IMPLEMENTATION_COMPLETE.md` - Completion summary

## Support

For issues:

1. Check browser console for errors
2. Verify location permissions are granted
3. Test on actual device (not simulator)
4. Check network connectivity
5. Review error messages in UI
