import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (value: number) => void;
  maxQuantity?: number;
  minQuantity?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  maxQuantity = Infinity,
  minQuantity = 1
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const newValue = Math.min(Math.max(value, minQuantity), maxQuantity);
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={quantity <= minQuantity}
        className="h-8 w-8"
      >
        -
      </Button>
      
      <Input
        type="number"
        value={quantity}
        onChange={handleChange}
        min={minQuantity}
        max={maxQuantity}
        className="w-16 h-8 text-center mx-2"
      />
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={quantity >= maxQuantity}
        className="h-8 w-8"
      >
        +
      </Button>
    </div>
  );
};

export default QuantitySelector;