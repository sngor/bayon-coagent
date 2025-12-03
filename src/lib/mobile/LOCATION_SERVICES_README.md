# Location Services Implementation

This document describes the location services implementation for mobile agent features.

## Overview

The location services module provides location-based features to enhance agent productivity in the field:

- **Location-based reminders** - Get notified when near appointment locations
- **Proximity notifications** - Automatic alerts using geofencing
- **One-tap navigation** - Quick access to device navigation apps
- **Arrival detection** - Automatic property information display on arrival
- **Check-in logging** - Track visits with GPS coordinates and timestamps

## Requirements Addressed

- **Requirement 9.1**: Location-based reminders for appointments
- **Requirement 9.2**: Proximity notifications using geofencing
- **Requirement 9.3**: One-tap navigation integration with device navigation apps
- **Requirement 9.4**: Arrival detection with property information display
- **Requirement 9.5**: Check-in logging with location and timestamp

## Architecture

### Core Service: `LocationServices`

The `LocationServices` class is a singleton that manages all location-based functionality:

```typescript
import { locationServices } from "@/lib/mobile/location-services";

// Start tracking location
locationServices.startLocationTracking();

// Get current location
const location = await locationServices.getCurrentLocation();

// Add geofence
locationServices.addGeofence({
  id: "geofence-1",
  location: { latitude: 37.7749, longitude: -122.4194 },
  radius: 200,
  appointmentId: "apt-1",
  onEnter: () => console.log("Entered geofence"),
});

// Stop tracking
locationServices.stopLocationTracking();
```

### Components

#### 1. LocationReminderComponent

Displays nearby appointments and allows navigation:

```tsx
import { LocationReminderComponent } from "@/components/mobile/location-reminder";

<LocationReminderComponent
  appointments={appointments}
  onNavigate={(appointment) => {
    // Handle navigation
  }}
/>;
```

#### 2. ProximityNotificationSetup

Configure proximity notifications with adjustable radius:

```tsx
import { ProximityNotificationSetup } from "@/components/mobile/proximity-notification-setup";

<ProximityNotificationSetup appointments={appointments} />;
```

#### 3. NavigationButton

One-tap navigation to any location:

```tsx
import { NavigationButton } from "@/components/mobile/navigation-button";

<NavigationButton
  destination={{ latitude: 37.7749, longitude: -122.4194 }}
  address="123 Main St, San Francisco, CA"
  label="Get Directions"
/>;
```

#### 4. ArrivalDisplay

Shows property information when agent arrives:

```tsx
import { ArrivalDisplay } from "@/components/mobile/arrival-display";

<ArrivalDisplay
  appointment={appointment}
  onCheckIn={() => {
    // Handle check-in
  }}
/>;
```

#### 5. CheckInLogger

Log visits with location and notes:

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

## Features

### 1. Location-Based Reminders (Req 9.1)

Automatically notify agents when they're near an appointment:

```typescript
const reminder = await locationServices.createLocationReminder(
  appointment,
  500 // radius in meters
);
```

Features:

- Configurable radius (default 500m)
- Automatic notification when entering geofence
- Tracks triggered state to avoid duplicate notifications
- Persists to localStorage

### 2. Proximity Notifications (Req 9.2)

Geofencing-based notifications for appointments:

```typescript
const notification = await locationServices.setupProximityNotification(
  appointment,
  200 // radius in meters
);
```

Features:

- Uses Geolocation API for position tracking
- Configurable notification radius (50-500m)
- Browser notification integration
- Tracks sent state to avoid duplicates
- Background location tracking

### 3. One-Tap Navigation (Req 9.3)

Open device navigation apps with a single tap:

```typescript
locationServices.openNavigation(
  { latitude: 37.7749, longitude: -122.4194 },
  "123 Main St, San Francisco, CA"
);
```

Platform-specific behavior:

- **iOS**: Opens Apple Maps (with Google Maps fallback)
- **Android**: Opens Google Maps navigation
- **Desktop**: Opens Google Maps in browser

### 4. Arrival Detection (Req 9.4)

Detect when agent arrives at appointment location:

```typescript
// Check if arrived
const hasArrived = await locationServices.detectArrival(appointment, 50);

// Setup automatic detection
locationServices.setupArrivalDetection(
  appointment,
  (appointment) => {
    // Show property information
  },
  50 // radius in meters
);
```

Features:

- Configurable arrival radius (default 50m)
- Automatic property information display
- Client notes and appointment details
- One-tap check-in

### 5. Check-In Logging (Req 9.5)

Log visits with GPS coordinates and timestamp:

```typescript
const checkIn = await locationServices.checkIn(
  userId,
  appointmentId,
  propertyId,
  "Optional notes about the visit"
);
```

Check-in data includes:

- GPS coordinates (latitude, longitude, accuracy)
- Timestamp
- User ID
- Appointment ID (optional)
- Property ID (optional)
- Notes (optional)
- Address (if reverse geocoding available)

## Geofencing

The geofencing system monitors location and triggers callbacks when entering regions:

```typescript
// Add geofence
locationServices.addGeofence({
  id: "unique-id",
  location: { latitude: 37.7749, longitude: -122.4194 },
  radius: 200, // meters
  appointmentId: "apt-1",
  onEnter: () => {
    // Triggered when entering region
  },
  onExit: () => {
    // Triggered when exiting region (optional)
  },
});

// Remove geofence
locationServices.removeGeofence("unique-id");

// Clear all geofences
locationServices.clearGeofences();
```

### How It Works

1. Location tracking runs continuously when enabled
2. Position updates trigger proximity checks
3. Distance calculated using Haversine formula
4. Callbacks executed when within geofence radius
5. Backup check runs every minute

## Distance Calculation

Uses the Haversine formula for accurate distance calculation:

```typescript
const distance = locationServices.calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 }
);

console.log(distance); // Distance in meters
```

## Permissions

Location services require user permission:

```typescript
// Check if location is available
const isAvailable = locationServices.isLocationAvailable();

// Request permission
const granted = await locationServices.requestLocationPermission();
```

Permission states:

- **granted**: Full access to location
- **denied**: No access (show fallback UI)
- **prompt**: User hasn't decided yet

## Data Persistence

### LocalStorage

Check-ins and triggered reminders are stored in localStorage:

```typescript
// Get all check-ins for a user
const checkIns = locationServices.getCheckIns(userId);
```

Storage keys:

- `check-ins`: Array of check-in records
- `triggered-reminders`: Array of triggered reminder records

### Future: DynamoDB Integration

For production, check-ins should be synced to DynamoDB:

```typescript
interface LocationCheckIn {
  PK: `USER#${string}`;
  SK: `CHECKIN#${string}`;
  id: string;
  userId: string;
  propertyId?: string;
  appointmentId?: string;
  location: LocationCoordinates;
  address?: string;
  notes?: string;
  timestamp: number;
  createdAt: string;
}
```

## Battery Optimization

Location tracking is optimized for battery life:

- **High accuracy mode**: Only when actively tracking
- **Maximum age**: 30 seconds (reuse recent positions)
- **Timeout**: 27 seconds (fail fast)
- **Backup checks**: Every 60 seconds (not continuous)

To minimize battery drain:

- Stop tracking when not needed
- Use appropriate accuracy settings
- Implement geofence radius wisely (larger = less frequent checks)

## Error Handling

All location operations include error handling:

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

Common errors:

- Permission denied
- Location unavailable
- Timeout
- Position unavailable

## Testing

### Manual Testing

1. **Location Reminders**:

   - Create appointments with different locations
   - Move device near appointment location
   - Verify notification appears

2. **Proximity Notifications**:

   - Enable notifications in settings
   - Adjust radius slider
   - Verify notifications at correct distance

3. **Navigation**:

   - Tap navigation button
   - Verify correct app opens (Maps on iOS, Google Maps on Android)
   - Test with and without address

4. **Arrival Detection**:

   - Move to appointment location
   - Verify arrival display appears
   - Check property information shown

5. **Check-In**:
   - Tap check-in button
   - Add notes
   - Verify location and timestamp recorded

### Automated Testing

Property-based tests should verify:

- Distance calculations are accurate
- Geofence triggers at correct radius
- Check-ins include all required data
- Navigation URLs are properly formatted

## Browser Compatibility

### Geolocation API

- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Edge

### Notifications API

- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS 16.4+/macOS)
- ✅ Firefox
- ✅ Edge

### Background Sync

- ✅ Chrome (Android/Desktop)
- ⚠️ Safari (Limited support)
- ✅ Firefox
- ✅ Edge

## Security & Privacy

### Location Data

- Location data is sensitive - handle with care
- Request permission with clear explanation
- Allow users to disable location tracking
- Store location data encrypted (in production)
- Provide data deletion options

### Best Practices

1. **Minimal Data Collection**: Only collect location when needed
2. **Clear Communication**: Explain why location is needed
3. **User Control**: Allow disabling location features
4. **Data Retention**: Implement retention policies (e.g., 30 days)
5. **Encryption**: Encrypt location data in transit and at rest

## Future Enhancements

### Reverse Geocoding

Add address lookup from coordinates:

```typescript
const address = await locationServices.reverseGeocode({
  latitude: 37.7749,
  longitude: -122.4194,
});
```

Requires integration with geocoding service (Google Maps, Mapbox, etc.)

### Route Optimization

Calculate optimal route for multiple appointments:

```typescript
const optimizedRoute = await locationServices.optimizeRoute(appointments);
```

### Location History

Track and visualize location history:

```typescript
const history = await locationServices.getLocationHistory(userId, dateRange);
```

### Offline Maps

Cache map tiles for offline use:

```typescript
await locationServices.cacheMapArea(bounds);
```

## Demo Page

A comprehensive demo is available at `/mobile/location`:

```
http://localhost:3000/mobile/location
```

The demo includes:

- Location reminders with nearby appointments
- Proximity notification configuration
- One-tap navigation examples
- Arrival detection simulation
- Check-in logging interface

## Integration Example

Complete example integrating all features:

```tsx
"use client";

import { useEffect, useState } from "react";
import { locationServices } from "@/lib/mobile/location-services";
import { LocationReminderComponent } from "@/components/mobile/location-reminder";
import { ArrivalDisplay } from "@/components/mobile/arrival-display";
import { CheckInLogger } from "@/components/mobile/check-in-logger";

export default function AppointmentPage({ appointment, userId }) {
  const [hasArrived, setHasArrived] = useState(false);

  useEffect(() => {
    // Setup location reminder
    locationServices.createLocationReminder(appointment, 500);

    // Setup proximity notification
    locationServices.setupProximityNotification(appointment, 200);

    // Setup arrival detection
    locationServices.setupArrivalDetection(
      appointment,
      () => setHasArrived(true),
      50
    );

    // Start tracking
    locationServices.startLocationTracking();

    return () => {
      locationServices.stopLocationTracking();
    };
  }, [appointment]);

  return (
    <div>
      {hasArrived && (
        <ArrivalDisplay
          appointment={appointment}
          onCheckIn={() => {
            // Handle check-in
          }}
        />
      )}

      <CheckInLogger
        userId={userId}
        appointmentId={appointment.id}
        propertyId={appointment.propertyId}
      />
    </div>
  );
}
```

## Support

For issues or questions:

1. Check browser console for errors
2. Verify location permissions are granted
3. Test on actual device (not simulator)
4. Check network connectivity
5. Review error messages in UI

## References

- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
