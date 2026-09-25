import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.evolv.app',
  appName: 'Evolv',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
