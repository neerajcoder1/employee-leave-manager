const { pool } = require('../src/config/db');

async function run() {
  console.log("Restoring other constraints...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add check_dates constraint back
    console.log("Adding check_dates constraint back...");
    await client.query(`
      ALTER TABLE leave_requests 
      ADD CONSTRAINT check_dates CHECK (end_date >= start_date);
    `);

    // Add status check constraint back
    console.log("Adding status check constraint back...");
    await client.query(`
      ALTER TABLE leave_requests 
      ADD CONSTRAINT leave_requests_status_check CHECK (status IN ('Pending', 'Approved', 'Rejected'));
    `);

    await client.query('COMMIT');
    console.log("Constraints restored successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Failed to restore constraints:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
