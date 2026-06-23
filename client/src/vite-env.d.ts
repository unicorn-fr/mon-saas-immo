/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Ambient module declaration for @vladmandic/face-api
// Install with: npm install @vladmandic/face-api
declare module '@vladmandic/face-api' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const nets: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const SsdMobilenetv1Options: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function detectSingleFace(input: any, options?: any): any
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_MAPBOX_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
