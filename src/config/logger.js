const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'audit.log');

const logger = {
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  },
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  },
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  },
  log(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
    
    // Write console outputs
    if (level === 'ERROR') {
      console.error(`[${level}] ${message}`, JSON.stringify(meta));
    } else {
      console.log(`[${level}] ${message}`);
    }

    // Append JSON log line to audit file
    fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', (err) => {
      if (err) {
        console.error('Failed to write to audit log:', err);
      }
    });
  }
};

module.exports = logger;
