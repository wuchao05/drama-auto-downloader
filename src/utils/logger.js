import winston from 'winston'
import { config } from '../config/index.js'

const { combine, timestamp, printf, colorize } = winston.format

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`
})

// 创建logger实例
export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: './logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})
