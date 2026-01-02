const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

 const NEPSE_API_URL = process.env.NEPSE_API_URL ;

 router.get('/stocks', async (req, res) => {
  try {
    const response = await fetch(NEPSE_API_URL);
    if (!response.ok) throw new Error('Failed to fetch from NEPSE API');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
