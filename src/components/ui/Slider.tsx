import React from 'react';
import { View, PanResponder, ViewProps, StyleSheet, Dimensions } from 'react-native';

interface SliderProps extends ViewProps {
  value?: number;
  min?: number;
  max?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ 
  value = 0, 
  min = 0, 
  max = 100, 
  onValueChange, 
  disabled,
  style,
  ...props 
}: SliderProps) {
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const percentage = ((value - min) / (max - min)) * 100;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        updateValue(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateValue(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const updateValue = (locationX: number) => {
    if (sliderWidth === 0) return;
    
    const newPercentage = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
    const newValue = min + (newPercentage / 100) * (max - min);
    
    onValueChange?.(Math.round(newValue));
  };

  return (
    <View 
      style={[styles.container, disabled && styles.disabled, style]} 
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      {...props}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <View
        style={[styles.thumb, { left: `${percentage}%` }]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0070F3',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0070F3',
    marginLeft: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});