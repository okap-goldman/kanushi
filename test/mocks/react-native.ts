// React Nativeのモック
export default {
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default,
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
};