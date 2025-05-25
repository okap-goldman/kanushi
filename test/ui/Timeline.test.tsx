import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Timeline from '@/screens/Timeline';

describe('Timeline Screen', () => {
  it('初期表示でローディングインジケーターを表示する', () => {
    // Arrange & Act
    const { getByTestId } = render(<Timeline />);

    // Assert
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('タブ切り替えができる', async () => {
    // Arrange
    const { getByText, getByTestId } = render(<Timeline />);
    
    // Act
    await waitFor(() => {
      expect(getByTestId('timeline-content')).toBeTruthy();
    });
    
    fireEvent.press(getByText('ウォッチ'));

    // Assert
    await waitFor(() => {
      expect(getByTestId('watch-timeline')).toBeTruthy();
    });
  });

  it('プルトゥリフレッシュで更新できる', async () => {
    // Arrange
    const { getByTestId } = render(<Timeline />);
    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // Act
    const list = getByTestId('timeline-list');
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: -100 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 800 }
      }
    });

    // Assert
    await waitFor(() => {
      expect(getByTestId('refresh-control')).toBeTruthy();
    });
  });

  it('無限スクロールが動作する', async () => {
    // Arrange
    const { getByTestId, getAllByTestId } = render(<Timeline />);
    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // Act
    const list = getByTestId('timeline-list');
    const initialPostCount = getAllByTestId(/^post-/).length;
    
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: 900 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 800 }
      }
    });

    // Assert
    await waitFor(() => {
      const currentPostCount = getAllByTestId(/^post-/).length;
      expect(currentPostCount).toBeGreaterThan(initialPostCount);
    });
  });
});
