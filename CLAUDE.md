# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kanushi is a React-based application built with Vite, TypeScript, and Tailwind CSS. The application appears to be a social platform with features like posts, user profiles, discovery, and regional exploration. It uses shadcn/ui components for the UI and includes 3D visualization capabilities with Three.js.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build the application for production
npm run build

# Build the application for development environment
npm run build:dev

# Lint the codebase
npm run lint

# Preview the production build
npm run preview
```

## Project Structure

- **src/components/** - UI components organized by feature
  - **ui/** - Shadcn UI components
  - **post/** - Components for post functionality
  - **discover/** - Components for discovery features
  - **profile/** - User profile components
  - **chat/** - Chat functionality

- **src/pages/** - Main application pages
  - **Index.tsx** - Main timeline view
  - **Profile.tsx** - User profile page
  - **Search.tsx** - Search functionality
  - **Discover.tsx** - Discovery page with regional activities

- **src/hooks/** - Custom React hooks
- **src/lib/** - Utilities and data

## Architecture Notes

- The application uses React Router for navigation
- TanStack Query (React Query) is used for data fetching
- The app has a mobile-first design with responsive components
- Three.js is used for 3D visualization in the Japan Map component
- The application uses a component-based architecture with reusable UI elements

## Key Features

1. **Posts System**: Users can create, view, and interact with posts that support multiple media types (text, image, video, audio)
2. **Discovery**: Regional exploration with a 3D map of Japan and region-specific information
3. **Timeline**: Users can switch between different timeline views ("family" and "watch")
4. **Regional Activities**: Shows activities and events by region
5. **Profile System**: User profiles with customizable information

## Important Implementation Details

- The Three.js implementation in `JapanMap3D.tsx` handles 3D rendering of regional data
- Sample data is currently used in some components (e.g., `SAMPLE_POSTS` in Index.tsx)
- The application uses a footer navigation for mobile users
- Dialog components are used for expanded views and interactions

## Development Notes

- 実装後のnpm run devは手動でやります