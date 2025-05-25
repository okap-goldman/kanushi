import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

// Form is just FormProvider from react-hook-form
export const Form = FormProvider;

// Context for FormField
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

// FormField component
export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// Context for FormItem
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

// Hook to use form field
export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// FormItem component
interface FormItemProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FormItem = ({ children, style }: FormItemProps) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View style={[styles.formItem, style]}>{children}</View>
    </FormItemContext.Provider>
  );
};

// FormLabel component
interface FormLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const FormLabel = ({ children, style }: FormLabelProps) => {
  const { error } = useFormField();

  return <Text style={[styles.label, error && styles.labelError, style]}>{children}</Text>;
};

// FormControl component - wrapper for form inputs
interface FormControlProps {
  children: React.ReactElement;
}

export const FormControl = ({ children }: FormControlProps) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return React.cloneElement(children, {
    accessibilityLabel: formItemId,
    accessibilityHint: !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`,
    accessibilityState: { disabled: !!error },
  });
};

// FormDescription component
interface FormDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const FormDescription = ({ children, style }: FormDescriptionProps) => {
  const { formDescriptionId } = useFormField();

  return (
    <Text id={formDescriptionId} style={[styles.description, style]} accessibilityRole="text">
      {children}
    </Text>
  );
};

// FormMessage component
interface FormMessageProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

export const FormMessage = ({ children, style }: FormMessageProps) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <Text id={formMessageId} style={[styles.errorMessage, style]} accessibilityRole="alert">
      {body}
    </Text>
  );
};

const styles = StyleSheet.create({
  formItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  labelError: {
    color: '#ef4444',
  },
  description: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
});
