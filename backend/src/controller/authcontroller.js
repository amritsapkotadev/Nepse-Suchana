const db = require('../config/databasesetup');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * REGISTER USER
 */
const register = async (req, res) => {
  const { name, password, email } = req.body;

  try {
    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user (DB enforces unique email)
    const result = await db.query(
      `INSERT INTO users (name, password_hash, email)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, hash, email]
    );

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Register error:', error);
     if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'Email already exists'
      });
    }
    return res.status(500).json({
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
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Remove sensitive data
    delete user.password_hash;

    return res.json({
      status: 'success',
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error.message
    });
  }
};

/**
 * LOGOUT USER
 */
const logout = async (req, res) => {
  res.clearCookie('token');
  return res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

/**
 * GET CURRENT USER
 */
const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authenticated'
    });
  }

  return res.json({
    status: 'success',
    user: req.user
  });
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
