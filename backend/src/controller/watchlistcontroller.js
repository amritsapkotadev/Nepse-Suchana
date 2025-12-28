const db = require('../db');
//add the stock to the user's watchlist
 const addtowatchlist=async(req,res)=>{
    const {userId,stockSymbol}=req.body;
    try{
        const result=await db.query(
            'INSERT INTO watchlist (user_id, stock_symbol) VALUES ($1, $2) RETURNING *',
            [userId,stockSymbol]
        );
        res.status(201).json({
            status:'success',
            message:'Stock added to watchlist',
            watchlistItem:result.rows[0]
        });
    }catch(error){
        res.status(500).json({
            status:'error',
            message:'Failed to add stock to watchlist',
            error:error.message
        });
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
    addToWatchlist:addtowatchlist,
    removeFromWatchlist:removefromwatchlist,
    getWatchlist:getwatchlist
 
 }; 