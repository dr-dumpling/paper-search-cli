export function shouldSuppressLogs() {
    return process.env.PAPER_SEARCH_QUIET === 'true';
}
export function logDebug(...args) {
    if (shouldSuppressLogs())
        return;
    if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
        console.error(...args);
    }
}
export function logInfo(...args) {
    if (shouldSuppressLogs())
        return;
    console.error(...args);
}
export function logWarn(...args) {
    if (shouldSuppressLogs())
        return;
    console.error(...args);
}
export function logError(...args) {
    if (shouldSuppressLogs())
        return;
    console.error(...args);
}
//# sourceMappingURL=Logger.js.map