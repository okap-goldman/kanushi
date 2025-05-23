import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Replicating the concept of variants from shadcn/ui
const buttonVariants = cva(
  "justify-center items-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-red-500",
        outline: "border border-border bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Text style variants to match button variants
const textVariants = {
  default: "text-primary-foreground font-medium",
  destructive: "text-white font-medium",
  outline: "text-foreground font-medium",
  secondary: "text-secondary-foreground font-medium",
  ghost: "text-foreground font-medium",
  link: "text-primary font-medium underline",
};

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

export const Button = ({
  variant = 'default',
  size = 'default',
  children,
  className,
  textClassName,
  disabled = false,
  loading = false,
  onPress,
  ...rest
}: ButtonProps) => {
  return (
    <TouchableOpacity
      className={cn(
        buttonVariants({ variant, size }),
        disabled && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' || variant === 'link' ? '#3b82f6' : '#ffffff'} 
        />
      ) : (
        <Text className={cn(textVariants[variant], textClassName)}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};