# React Native + Expo Implementation Details

## Overview

This document provides technical details about the implementation of the React Native + Expo version of the application.

## Architecture

The mobile application follows a similar architecture to the web version but adapted for React Native:

- **Navigation**: Uses React Navigation instead of React Router
- **UI Components**: Uses native components instead of web components
- **Styling**: Uses NativeWind instead of Tailwind CSS directly
- **State Management**: Uses the same TanStack Query for data fetching

## Key Technologies

- **React Native**: Core framework
- **Expo**: Development platform and tools
- **React Navigation**: For routing and navigation
- **NativeWind**: For styling with Tailwind syntax
- **TanStack Query**: For data fetching and state management

## Folder Structure

```
mobile/
├── assets/              # Images, fonts, and other static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Basic UI components (button, input, etc.)
│   ├── contexts/        # Context providers (auth, theme, etc.)
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Screen components
│   └── utils/           # Utility functions
├── App.tsx              # Entry point
├── babel.config.js      # Babel configuration
├── tailwind.config.js   # NativeWind configuration
```

## Component Mapping

The following web components were migrated to their React Native equivalents:

| Web Component | React Native Component |
| ------------- | ---------------------- |
| Button | TouchableOpacity with styling |
| Input | TextInput with styling |
| Dialog | Modal |
| Card | View with border styling |
| FooterNav | Tab.Navigator |

## State Management

Authentication state is managed through a React Context similar to the web version, but adapted for React Native.

## Styling

NativeWind is used to maintain Tailwind CSS syntax compatibility:

```tsx
// Web (Tailwind CSS)
<div className="flex p-4 bg-white rounded-lg">...</div>

// Mobile (NativeWind)
<View className="flex-row p-4 bg-white rounded-lg">...</View>
```

## Next Steps

1. Complete implementation of remaining screens
2. Integrate with Supabase backend
3. Add native functionality (camera, notifications)
4. Test on various devices and platforms
5. Set up CI/CD for mobile builds