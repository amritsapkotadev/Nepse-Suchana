const db = require('../db');
const jwt = require('jsonwebtoken');


//get all the watchlist items of a user
const getUserWatchlist = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.status(200).json({ status: 'success', watchlist: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve watchlist', error: err.message });
  }
};




//add the stock to the user's watchlist
 const addToWatchlist = async (req, res) => {
  const user_id = req.user.id;  
  const { stock_symbol } = req.body;
  if (!stock_symbol) {
    return res.status(400).json({ error: 'stock_symbol is required.' });
  }
  try {
    const result = await db.query(
      'INSERT INTO watchlist (user_id, stock_symbol) VALUES ($1, $2) RETURNING *',
      [user_id, stock_symbol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique_violation in PostgreSQL
      return res.status(409).json({ error: 'Stock already in watchlist.' });
    }
    res.status(500).json({ error: err.message });
  }
};
//remove the stock from the user's watchlist
 const removefromwatchlist=async(req,res)=>{
    const {userId,stockSymbol}=req.body;
    try{
        const result=await db.query(
            'DELETE FROM watchlist WHERE user_id=$1 AND stock_symbol=$2 RETURNING *',
            [userId,stockSymbol]
        );
        if(result.rows.length===0){
            return res.status(404).json({
                status:'error',
                message:'Stock not found in watchlist'
            });
        }
        res.json({
            status:'success',           
            message:'Stock removed from watchlist',
            watchlistItem:result.rows[0]
        });
    }catch(error){
        res.status(500).json({
            status:'error',
            message:'Failed to remove stock from watchlist',
            error:error.message
        });
    }
 };
//get the user's watchlist
 const getwatchlist=async(req,res)=>{
    const {userId}=req.params;
    try{
        const result=await db.query(
            'SELECT * FROM watchlist WHERE user_id=$1',
            [userId]
        );              
        res.json({
            status:'success',
            watchlist:result.rows
        });
    }catch(error){
        res.status(500).json({
            status:'error',
            message:'Failed to retrieve watchlist',
            error:error.message
        });
    }
 };

 module.exports={
    addToWatchlist:addToWatchlist,
    removeFromWatchlist:removefromwatchlist,
    getWatchlist:getwatchlist,
    getUserWatchlist:getUserWatchlist
 
 };