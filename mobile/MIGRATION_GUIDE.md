# Component Migration Guide

This guide outlines how to migrate shadcn/ui components used in the React + Vite application to React Native components with NativeWind.

## UI Components Migration

### Button
- **Web**: `<Button>` from `@/components/ui/button`
- **Mobile**: `<Button>` from `src/components/ui/button`
- **Notes**: Implemented with TouchableOpacity, accepts variant and size props similar to shadcn/ui

### Input
- **Web**: `<Input>` from `@/components/ui/input`
- **Mobile**: `<Input>` from `src/components/ui/input`
- **Notes**: Implemented with TextInput and adds label and error props

### Dialog
- **Web**: `<Dialog>` from `@/components/ui/dialog`
- **Mobile**: Use React Native's `<Modal>` component
- **Notes**: See example in the Post component for implementation

### Card
- **Web**: `<Card>` from `@/components/ui/card`
- **Mobile**: `<View>` with border styling
- **Notes**: See Post component for an example of card-like styling

### Avatar
- **Web**: `<Avatar>` from `@/components/ui/avatar`
- **Mobile**: `<Image>` with circular styling (rounded-full)

### Icons
- **Web**: `lucide-react` icons
- **Mobile**: `@expo/vector-icons` (Ionicons, MaterialIcons, etc.)
- **Notes**: 
  - Home → home, home-outline
  - Search → search, search-outline
  - PlusSquare → add-circle, add-circle-outline
  - Compass → compass, compass-outline
  - User → person, person-outline
  - MessageCircle → chatbubble, chatbubble-outline

## Navigation Migration

### React Router → React Navigation

- **BrowserRouter**: Replace with `<NavigationContainer>`
- **Routes**: Replace with `<Stack.Navigator>`
- **Route**: Replace with `<Stack.Screen>`
- **Link**: Replace with navigation functions (`navigation.navigate()`)
- **useLocation**: Replace with React Navigation hooks (`useRoute()`)
- **Nested routes**: Use nested navigators (Stack inside Tabs, etc.)

### Footer Navigation

- **Web**: Custom `<FooterNav>` component with Links
- **Mobile**: `<Tab.Navigator>` from `@react-navigation/bottom-tabs`

## Layout and Styling

### Tailwind CSS → NativeWind

- Most Tailwind classes work directly with NativeWind
- Some web-specific classes that don't transfer:
  - `grid` → use `flex-row flex-wrap`
  - `hover:` states → use `activeOpacity` with TouchableOpacity
  - `focus:` states → manage focus state with React state
  - Media queries → use different logic with Dimensions API

### Content Layout

- **Web**: Using semantic HTML (main, section, header)
- **Mobile**: Using View, ScrollView, SafeAreaView

## Animation and Transitions

- **Web**: CSS transitions, Radix UI animations
- **Mobile**: React Native Animated API, Reanimated

## Forms and Inputs

- **Web**: react-hook-form + zod
- **Mobile**: react-hook-form + zod (still works, but with RN inputs)

## API Integration

- TanStack React Query works the same way in React Native
- Use the same patterns for data fetching and caching