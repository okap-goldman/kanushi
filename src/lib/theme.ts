export const theme = {
  colors: {
    // Primary - Emerald Green
    primary: {
      main: '#10B981', // Emerald-500
      light: '#34D399', // Emerald-400
      lighter: '#6EE7B7', // Emerald-300
      dark: '#059669', // Emerald-600
      darker: '#047857', // Emerald-700
    },
    
    // Secondary - Bright Pink (White-ish Pink)
    secondary: {
      main: '#FFB8C8', // Bright Pink
      light: '#FFD1DC', // Light Pink
      lighter: '#FFE8F1', // Very Light Pink
      dark: '#FF91B8', // Medium Pink
      darker: '#FF6FA6', // Dark Pink
    },
    
    // Accent - Bright Pink metallic
    accent: {
      main: '#FFC0CB', // Classic Pink
      light: '#FFDCE5', // Light Pink
      dark: '#FF99C3', // Deeper Pink
    },
    
    // Text colors
    text: {
      primary: '#064E3B', // Emerald-900
      secondary: '#047857', // Emerald-700
      muted: '#6B7280', // Gray-500
      light: '#9CA3AF', // Gray-400
      inverse: '#FFFFFF',
    },
    
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6', // Gray-100
      tertiary: '#E5E7EB', // Gray-200
      emerald: {
        subtle: '#ECFDF5', // Emerald-50
        light: '#D1FAE5', // Emerald-100
      },
      rose: {
        subtle: '#FFF5F8', // Very Light Pink
        light: '#FFECF1', // Light Pink
      },
    },
    
    // Border colors
    border: {
      default: '#D1D5DB', // Gray-300
      light: '#E5E7EB', // Gray-200
      emerald: '#A7F3D0', // Emerald-200
      rose: '#FFE0EC', // Light Pink Border
    },
    
    // Status colors
    status: {
      success: '#10B981', // Emerald-500
      warning: '#F59E0B', // Amber-500
      error: '#EF4444', // Red-500
      info: '#3B82F6', // Blue-500
    },
    
    // Shadow colors
    shadow: {
      emerald: 'rgba(16, 185, 129, 0.1)',
      rose: 'rgba(251, 113, 133, 0.1)',
    },
  },
  
  // Common shadow styles
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    emerald: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    rose: {
      shadowColor: '#FFB8C8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Helper function to get theme colors
export const getThemeColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = theme.colors;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
};