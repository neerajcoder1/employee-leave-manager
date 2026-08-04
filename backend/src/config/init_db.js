const fs = require('fs');
const path = require('path');
const db = require('./db');

/**
 * Utility script to initialize database tables and seeds by executing schema.sql
 */
const initializeDatabase = async () => {
  console.log('Initializing database schema...');
  const schemaPath = path.join(__dirname, '../../schema.sql');

  try {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute DDL statements
    await db.query(schemaSql);
    
    console.log('==================================================');
    console.log('  Database schema and seeds initialized successfully!');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

initializeDatabase();
