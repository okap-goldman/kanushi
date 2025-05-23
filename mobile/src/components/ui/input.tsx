import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../utils/cn';

export interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="w-full space-y-1.5">
        {label && (
          <Text className="text-sm font-medium text-foreground">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            "h-10 px-3 py-2 text-foreground bg-background border border-border rounded-md",
            "focus:border-primary focus:ring-primary",
            error && "border-red-500",
            className
          )}
          placeholderTextColor="#64748b"
          {...props}
        />
        {error && (
          <Text className="text-sm text-red-500">
            {error}
          </Text>
        )}
      </View>
    );
  }
);