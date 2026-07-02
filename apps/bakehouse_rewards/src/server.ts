import express from 'express';
import cors from 'cors';
import path from 'path';
import { DBSQLClient } from '@databricks/sql';

const app = express();
const port = process.env.PORT || 8000;

// Databricks SQL Connection
const sqlClient = new DBSQLClient();
let sqlConnection: any = null;

// Initialize Databricks SQL connection
async function initDatabricksSQL() {
  try {
    sqlConnection = await sqlClient.connect({
      host: process.env.DATABRICKS_HOST || '',
      path: process.env.DATABRICKS_SQL_WAREHOUSE_PATH || '/sql/1.0/warehouses/1c1f49a0ddc0acd7',
      token: process.env.DATABRICKS_TOKEN || '',
    });
    console.log('✅ Connected to Databricks SQL (Lakehouse)');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to connect to Databricks SQL:', error.message);
    return false;
  }
}

// Helper function to execute SQL queries
async function executeSQLQuery(sql: string) {
  if (!sqlConnection) {
    throw new Error('Database connection not initialized');
  }
  
  const session = await sqlConnection.openSession();
  try {
    const queryOperation = await session.executeStatement(sql, {
      runAsync: false,
      maxRows: 1000,
    });
    
    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    return result;
  } finally {
    await session.close();
  }
}

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Bakehouse Rewards API is running',
    timestamp: new Date().toISOString(),
    services: {
      lakehouse: sqlConnection ? 'connected (Unity Catalog)' : 'disconnected',
      lakebase: 'pending (will be added next)'
    }
  });
});

// Config check
app.get('/api/config', (req, res) => {
  res.json({
    sql_warehouse_id: process.env.SQL_WAREHOUSE_ID || 'not configured',
    lakebase: {
      project: process.env.LAKEBASE_PROJECT || 'not configured',
      branch: process.env.LAKEBASE_BRANCH || 'not configured',
      database: process.env.LAKEBASE_DATABASE || 'not configured',
      host: process.env.LAKEBASE_HOST ? 'configured' : 'not configured'
    }
  });
});

// Lakehouse endpoint: Get top customers (REAL DATA from Unity Catalog)
app.get('/api/customers', async (req, res) => {
  try {
    const sql = `
      SELECT 
        customer_email,
        total_points,
        points_redeemed,
        points_available,
        total_spent,
        transaction_count,
        last_transaction_date
      FROM bakehouse.rewards.customer_rewards
      ORDER BY total_points DESC
      LIMIT 50
    `;
    
    const customers = await executeSQLQuery(sql);
    res.json({ customers, source: 'Unity Catalog (bakehouse.rewards.customer_rewards)' });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get transactions (REAL DATA from Unity Catalog)
app.get('/api/transactions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const sql = `
      SELECT 
        transaction_id,
        transaction_date,
        amount,
        points_earned,
        product_category
      FROM bakehouse.rewards.transactions
      WHERE customer_email = '${email}'
      ORDER BY transaction_date DESC
      LIMIT 50
    `;

    const transactions = await executeSQLQuery(sql);
    res.json({ transactions, source: 'Unity Catalog (bakehouse.rewards.transactions)' });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get redemption history (REAL DATA from Unity Catalog)
app.get('/api/redemptions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const sql = `
      SELECT 
        redemption_id,
        customer_email,
        points_redeemed,
        reward_type,
        redemption_date
      FROM bakehouse.rewards.redemptions
      WHERE customer_email = '${email}'
      ORDER BY redemption_date DESC
      LIMIT 50
    `;

    const redemptions = await executeSQLQuery(sql);
    res.json({ redemptions, source: 'Unity Catalog (bakehouse.rewards.redemptions)' });
  } catch (error: any) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch redemptions',
      message: error.message 
    });
  }
});

// Lakebase endpoint: Redeem points (MOCK for now - will use PostgreSQL next)
app.post('/api/redeem', async (req, res) => {
  try {
    const { customer_email, points_redeemed, reward_type } = req.body;
    
    if (!customer_email || !points_redeemed || !reward_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: customer_email, points_redeemed, reward_type' 
      });
    }

    // Mock redemption for now - will use Lakebase PostgreSQL next
    const redemption = {
      redemption_id: 'RED' + Date.now(),
      customer_email,
      points_redeemed,
      reward_type,
      redemption_date: new Date().toISOString()
    };

    res.json({ 
      success: true,
      redemption,
      note: 'Mock data - Lakebase PostgreSQL integration coming next'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to redeem points',
      message: error.message 
    });
  }
});

// Initialize and start server
async function startServer() {
  await initDatabricksSQL();
  
  app.listen(port, () => {
    console.log(`✅ Bakehouse Rewards app running on port ${port}`);
    console.log(`✅ Connected to Lakehouse: ${sqlConnection ? 'YES' : 'NO'}`);
    console.log('🔗 Ready to serve real data from Unity Catalog!');
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});