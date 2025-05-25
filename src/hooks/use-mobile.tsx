import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    const { width } = Dimensions.get('window');
    return width < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const updateDimensions = ({ window }: { window: { width: number; height: number } }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      subscription?.remove();
    };
  }, []);

  return isMobile;
}
