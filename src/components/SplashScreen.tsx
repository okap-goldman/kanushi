import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out the splash screen after a delay
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onFinish after animation completes
      setTimeout(onFinish, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-white z-50 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-screen">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="w-64 h-64 object-contain animate-pulse" 
        />
      </div>
    </div>
  );
}