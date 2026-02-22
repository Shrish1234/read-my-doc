/// <reference types="vite/client" />

interface ChromeRuntime {
  sendMessage(extensionId: string, message: unknown, callback?: (response: unknown) => void): void;
  lastError?: { message?: string };
}

interface Chrome {
  runtime: ChromeRuntime;
}

interface Window {
  chrome?: Chrome;
}
