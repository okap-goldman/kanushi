# Kanushi Mobile App

A React Native mobile application for the Kanushi platform, built with Expo.

## Features

- Timeline feed with multi-media posts (text, image, video, audio)
- User profiles and social connections (following/followers)
- Messaging system
- Location-based discovery
- Events system
- E-commerce functionality

## Technology Stack

- React Native
- Expo
- TypeScript
- Supabase (Backend & Auth)
- React Navigation
- TanStack Query
- Expo AV for audio/video

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or Yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Emulator or physical device (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd kanushi/expo-app
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env` file in the root of the project with the following variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator/device
npx expo run:android
```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/screens` - Main screens of the application
- `/src/navigation` - Navigation configuration
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utilities and services
- `/src/context` - React context providers

## Deployment

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.