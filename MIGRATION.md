# Migration from React + Vite to React Native + Expo

This document outlines the process and changes made to migrate the Kanushi web application from React + Vite to a mobile application using React Native + Expo.

## Key Changes

### Project Structure

The new Expo project maintains a similar structure to the original web application but adapts it for mobile:

- `/src/components` - Reusable UI components (same purpose as web app)
- `/src/screens` - Equivalent to `pages` in the web app, but specifically for mobile screens
- `/src/navigation` - Replace React Router with React Navigation
- `/src/lib` - Maintained services with adaptations for mobile
- `/src/context` - Same context approach, adapted for React Native

### UI Components

- Replaced Shadcn UI components with custom React Native components
- Converted Tailwind CSS styles to React Native StyleSheet
- Designed mobile-specific interactions and layouts
- Used Expo Vector Icons instead of Lucide icons

### Backend Integration

- Adapted Supabase integration for React Native
- Used expo-secure-store for token storage instead of browser localStorage
- Added polyfills for necessary web APIs in the React Native environment

### Navigation

- Replaced React Router with React Navigation
- Implemented stack navigation for screen flows
- Added tab navigation for the main app screens
- Implemented proper mobile-specific navigation patterns

### Media Handling

- Used expo-image-picker for image/video selection
- Used expo-av for audio/video playback and recording
- Adapted file uploads to work with React Native's file system

### Authentication

- Adapted auth flow to a mobile context
- Implemented secure storage for auth tokens
- Created mobile-specific login and registration screens

## Major Adjustments

1. **Styling**: The most significant change was moving from Tailwind CSS to React Native's StyleSheet. All styling had to be manually converted.

2. **Component Hierarchy**: Component structures needed adjustment to fit React Native's approach (e.g., no div/span elements, replaced with View/Text).

3. **Navigation**: Complete reimplementation of navigation using React Navigation's stack and tab navigators.

4. **Media Interactions**: Reworked all media interactions to use Expo's native APIs instead of web browser APIs.

5. **Layouts**: Replaced CSS Grid/Flexbox with React Native's Flexbox implementation.

6. **Form Elements**: Replaced HTML form elements with React Native equivalents.

## Benefits of the Migration

1. **Native Performance**: The app now runs natively on iOS and Android.

2. **Device Features**: Can access native device features (camera, filesystem, notifications).

3. **Offline Capability**: Better support for offline functionality.

4. **Distribution**: Can be published to App Store and Google Play.

5. **User Experience**: Provides a more native-feeling experience to mobile users.

## Next Steps

- Complete implementation of all features from the web app
- Add mobile-specific features (push notifications, deep linking)
- Implement offline support
- Optimize performance for lower-end devices
- Add automated testing for mobile

## Tools Used

- Expo SDK
- React Navigation
- Expo Vector Icons
- Expo Image
- Expo AV (Audio/Video)
- Expo Secure Store
- React Native Gesture Handler