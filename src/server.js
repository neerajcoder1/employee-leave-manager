require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server
const server = serverBootstrap();

function serverBootstrap() {
  const activeServer = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`  API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`==================================================`);
  });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('SIGTERM/SIGINT signal received: closing HTTP server...');
    activeServer.close(async () => {
      console.log('HTTP server closed.');
      try {
        await db.pool.end();
        console.log('PostgreSQL client pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during pool shutdown:', err.stack);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return activeServer;
}

module.exports = server;
