import dotenv from 'dotenv';
dotenv.config();

import { query } from '../lib/db';

async function migrate() {
  try {
    console.log('Running migration: Add transaction_type column to portfolio_holdings');
    
    // Check if column exists
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'portfolio_holdings' 
      AND column_name = 'transaction_type'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add the column
      await query(`
        ALTER TABLE portfolio_holdings 
        ADD COLUMN transaction_type VARCHAR(10) DEFAULT 'Buy'
      `);
      console.log('✓ Added transaction_type column');
      
      // Update existing records to have 'Buy' as default
      await query(`
        UPDATE portfolio_holdings 
        SET transaction_type = 'Buy' 
        WHERE transaction_type IS NULL
      `);
      console.log('✓ Updated existing records');
    } else {
      console.log('✓ Column already exists');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
