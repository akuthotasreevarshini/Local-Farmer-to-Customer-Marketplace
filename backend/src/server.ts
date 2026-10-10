import 'dotenv/config';
import { validateEnv, env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

const DB_CONNECTION_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  // 1. Fail fast if any required env var is absent
  validateEnv();

  // 2. Connect to MongoDB with a hard timeout so a misconfigured URI doesn't
  //    leave the process hanging indefinitely
  const dbTimeout = setTimeout(() => {
    console.error('Database connection timed out after 10 seconds');
    process.exit(1);
  }, DB_CONNECTION_TIMEOUT_MS);

  try {
    await connectDB();
    clearTimeout(dbTimeout);
  } catch (err) {
    clearTimeout(dbTimeout);
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  // 3. Start the HTTP server
  const server = app.listen(env.port, () => {
    console.log(
      `Server running on port ${env.port} [${env.nodeEnv}]`
    );
  });

  // 4. Graceful shutdown on SIGTERM / SIGINT
  const shutdown = (signal: string): void => {
    console.log(`${signal} received – shutting down gracefully`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
