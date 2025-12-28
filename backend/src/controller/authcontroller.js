const db = require('../config/databasesetup'); 

const register = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }

    const result = await db.query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, password, email]
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error.message
    });
  }
};

const login = async (req, res) => {
   const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE email = $1 AND password_hash = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({
        status: 'success',
        message: 'Login successful',
        user: result.rows[0]
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};