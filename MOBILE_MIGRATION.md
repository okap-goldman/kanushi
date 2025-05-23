# React Native + Expo Migration

This document provides guidance on migrating the web application (React + Vite) to a mobile application (React Native + Expo).

## Migration Overview

The migration involves the following key changes:

1. Replacing React Router with React Navigation
2. Converting shadcn/ui components to React Native components
3. Adapting Tailwind CSS styles to NativeWind or React Native StyleSheet
4. Converting web-specific code to use React Native APIs

## Component Mapping

| Web Component | Mobile Component |
| ------------- | ---------------- |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| `<input>` | `<TextInput>` |
| `<img>` | `<Image>` |
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1>`, etc. | `<Text>` |
| `<ul>`, `<ol>` | `<FlatList>` or `<ScrollView>` |
| Dialog, Modal | `<Modal>` |

## Migration Progress

The `/mobile` directory contains a React Native + Expo implementation with:

- Basic app infrastructure
- Navigation setup with React Navigation
- UI components converted from shadcn/ui
- Sample screens for each main section
- Authentication context similar to the web version

## Next Steps

To complete the migration:

1. Convert remaining screens and components
2. Set up API integrations with Supabase
3. Implement remaining features and functionality
4. Testing on iOS and Android devices

## Development Instructions

To run the React Native version:

```sh
cd mobile
npm install
npm start
```

See the [README.md](./README.md) for more details on running the app.

## References

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started/)
- [NativeWind Documentation](https://www.nativewind.dev/)