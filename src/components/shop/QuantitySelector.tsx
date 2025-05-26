import type React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (value: number) => void;
  maxQuantity?: number;
  minQuantity?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  maxQuantity = Number.POSITIVE_INFINITY,
  minQuantity = 1,
}) => {
  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > minQuantity) {
      onChange(quantity - 1);
    }
  };

  const handleChangeText = (text: string) => {
    const value = Number.parseInt(text);
    if (!isNaN(value)) {
      const newValue = Math.min(Math.max(value, minQuantity), maxQuantity);
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={quantity <= minQuantity}
        style={[styles.button, quantity <= minQuantity && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, quantity <= minQuantity && styles.buttonTextDisabled]}>
          -
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={quantity.toString()}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        selectTextOnFocus
      />

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={quantity >= maxQuantity}
        style={[styles.button, quantity >= maxQuantity && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, quantity >= maxQuantity && styles.buttonTextDisabled]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  input: {
    width: 64,
    height: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 16,
  },
});

export default QuantitySelector;
