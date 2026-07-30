import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'log.log');

function formatMessage(level: string, message: string, context?: any) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const contextStr = context ? ' ' + JSON.stringify(context) : '';
  return `[${timestamp}] local.${level}: ${message}${contextStr}\n`;
}

function writeLog(level: string, message: string, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    const contextStr = context ? ' ' + JSON.stringify(context) : '';
    console.log(`[${level}] ${message}${contextStr}`);
    return;
  }
  try {
    const logLine = formatMessage(level, message, context);
    fs.appendFileSync(LOG_FILE_PATH, logLine, 'utf8');
  } catch (error) {
    console.error('Failed to write to log.log:', error);
  }
}

export const logger = {
  info: (message: string, context?: any) => writeLog('INFO', message, context),
  error: (message: string, context?: any) => writeLog('ERROR', message, context),
  warn: (message: string, context?: any) => writeLog('WARNING', message, context),
};
