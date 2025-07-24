import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.serpent.elementai',
  appName: 'Serpent Element AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Device: {
      deviceInfo: true
    },
    App: {
      appUrlOpen: true
    },
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#100c14",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#100c14'
  },
  android: {
    backgroundColor: '#100c14'
  }
};

export default config;
