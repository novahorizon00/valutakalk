import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.valutakalk.valutakalkulator',
  appName: 'Valutakalk',
  webDir: 'dist',
  server: {
    url: 'https://84a89c14-0016-4e37-a026-0a24f8584dd2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
