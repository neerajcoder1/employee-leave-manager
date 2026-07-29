const db = require('../config/db');

/**
 * User Model
 */
const User = {
  /**
   * Find a user by username
   * @param {string} username 
   */
  async findByUsername(username) {
    const queryText = `
      SELECT id, username, password, role, created_at 
      FROM users 
      WHERE username = $1
    `;
    const { rows } = await db.query(queryText, [username]);
    return rows[0];
  },

  /**
   * Find a user by ID
   * @param {string} id 
   */
  async findById(id) {
    const queryText = `
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = $1
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  },

  /**
   * Register a new employee and initialize their leave balance in a database transaction
   * @param {string} username 
   * @param {string} hashedPassword 
   * @param {string} role 
   */
  async createUser(username, hashedPassword, role = 'employee') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert user
      const insertUserQuery = `
        INSERT INTO users (username, password, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, created_at
      `;
      const userRes = await client.query(insertUserQuery, [username, hashedPassword, role]);
      const newUser = userRes.rows[0];

      // 2. Initialize leave balances for employees
      if (role === 'employee') {
        const insertBalanceQuery = `
          INSERT INTO leave_balances (employee_id)
          VALUES ($1)
        `;
        await client.query(insertBalanceQuery, [newUser.id]);
      }

      await client.query('COMMIT');
      return newUser;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Fetch employee details along with their leave balances
   * @param {string} userId 
   */
  async getProfileWithBalance(userId) {
    const queryText = `
      SELECT u.id, u.username, u.role, u.created_at,
             lb.annual_leave, lb.sick_leave, lb.casual_leave
      FROM users u
      LEFT JOIN leave_balances lb ON u.id = lb.employee_id
      WHERE u.id = $1
    `;
    const { rows } = await db.query(queryText, [userId]);
    return rows[0];
  },

  /**
   * Retrieve all registered employees
   */
  async getAllEmployees() {
    const queryText = `
      SELECT u.id, u.username, u.role, u.created_at,
             lb.annual_leave, lb.sick_leave, lb.casual_leave
      FROM users u
      LEFT JOIN leave_balances lb ON u.id = lb.employee_id
      WHERE u.role = 'employee'
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.query(queryText);
    return rows;
  }
};

module.exports = User;
