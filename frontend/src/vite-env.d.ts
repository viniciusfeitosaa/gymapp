/// <reference types="vite/client" />

declare module 'canvas-confetti' {
  function confetti(options?: unknown): Promise<null>;
  export default confetti;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
