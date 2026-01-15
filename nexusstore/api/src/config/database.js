import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'nexusstore',
  user: process.env.DB_USER || 'nexusstore_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Connect to database
export async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL database');

    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('  Database time:', result.rows[0].now);

    client.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection error:', error.message);
    throw error;
  }
}

// Execute query
export async function query(text, params) {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.log('Slow query:', {
        text: text.substring(0, 80),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }

    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

// Get a client from pool (for transactions)
export async function getClient() {
  return pool.connect();
}

// Initialize storage directories
export async function initStorage() {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const appsDir = process.env.APPS_DIR || './uploads/apps';

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(appsDir, { recursive: true });
    await fs.mkdir(path.join(uploadDir, 'temp'), { recursive: true });
    await fs.mkdir(path.join(uploadDir, 'icons'), { recursive: true });
    console.log('✓ Storage directories initialized');
  } catch (error) {
    console.error('✗ Failed to create storage directories:', error.message);
    throw error;
  }
}

// Get app directory path
export function getAppDir(appId) {
  return path.join(process.env.APPS_DIR || './uploads/apps', appId);
}

// Get file path for app
export function getAppFilePath(appId, filename) {
  return path.join(getAppDir(appId), filename);
}

// Create app directory
export async function createAppDir(appId) {
  const dir = getAppDir(appId);
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(dir, 'screenshots'), { recursive: true });
  return dir;
}

// Delete app directory
export async function deleteAppDir(appId) {
  const dir = getAppDir(appId);
  await fs.rm(dir, { recursive: true, force: true });
}

// Close database pool
export async function closeDB() {
  await pool.end();
  console.log('Database pool closed');
}

export default pool;
