import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promotify.app',
  appName: 'Promotify',
  webDir: 'build/client',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0d1117",
      showSpinner: false
    }
  }
};

export default config;
