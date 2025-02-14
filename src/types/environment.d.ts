declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // ... other env vars
      LOG_LEVELS?: string;
    }
  }
}

export {};
