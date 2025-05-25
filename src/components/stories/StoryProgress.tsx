import React, { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface StoryProgressProps {
  count: number;
  activeIndex: number;
  duration?: number;
  onComplete?: () => void;
  isPaused?: boolean;
}

export default function StoryProgress({
  count,
  activeIndex,
  duration = 5000,
  onComplete,
  isPaused = false,
}: StoryProgressProps) {
  const progressAnims = useRef(
    Array(count)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Reset animations for new active index
    progressAnims.forEach((anim, index) => {
      if (index < activeIndex) {
        anim.setValue(1);
      } else if (index > activeIndex) {
        anim.setValue(0);
      }
    });

    // Start animation for active index
    if (!isPaused && activeIndex < count) {
      const animation = Animated.timing(progressAnims[activeIndex], {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished && onComplete) {
          onComplete();
        }
      });

      return () => {
        animation.stop();
      };
    }
  }, [activeIndex, count, duration, isPaused, onComplete]);

  useEffect(() => {
    if (isPaused) {
      progressAnims[activeIndex].stopAnimation();
    }
  }, [isPaused, activeIndex]);

  return (
    <View style={styles.container}>
      {progressAnims.map((anim, index) => (
        <View key={index} style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
