export function shouldSuppressLogs(): boolean {
  return process.env.PAPER_SEARCH_QUIET === 'true';
}

export function logDebug(...args: any[]): void {
  if (shouldSuppressLogs()) return;
  if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
    console.error(...args);
  }
}

export function logInfo(...args: any[]): void {
  if (shouldSuppressLogs()) return;
  console.error(...args);
}

export function logWarn(...args: any[]): void {
  if (shouldSuppressLogs()) return;
  console.error(...args);
}

export function logError(...args: any[]): void {
  if (shouldSuppressLogs()) return;
  console.error(...args);
}
