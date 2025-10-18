/**
 * Structured logging utility for edge functions
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  time: string;
  level: LogLevel;
  msg: string;
  meta?: any;
  function?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Main logging function
 */
export function log(
  level: LogLevel,
  msg: string,
  meta?: any
): void {
  const entry: LogEntry = {
    time: new Date().toISOString(),
    level,
    msg,
    meta,
  };

  const line = JSON.stringify(entry);
  
  // Use appropriate console method based on level
  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'debug':
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

/**
 * Convenience methods
 */
export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
  debug: (msg: string, meta?: any) => log('debug', msg, meta),
};

/**
 * Create a scoped logger with context
 */
export function createLogger(context: { function?: string; userId?: string; requestId?: string }) {
  return {
    info: (msg: string, meta?: any) => log('info', msg, { ...context, ...meta }),
    warn: (msg: string, meta?: any) => log('warn', msg, { ...context, ...meta }),
    error: (msg: string, meta?: any) => log('error', msg, { ...context, ...meta }),
    debug: (msg: string, meta?: any) => log('debug', msg, { ...context, ...meta }),
  };
}
