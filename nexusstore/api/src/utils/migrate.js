import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('Starting database migration...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'nexusstore',
    user: process.env.DB_USER || 'nexusstore_user',
    password: process.env.DB_PASSWORD
  });

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Running migrations...\n');

    // Execute schema
    await client.query(schema);

    console.log('✓ Schema applied successfully');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nCreated tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    client.release();

    console.log('\n✓ Migration completed successfully');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
