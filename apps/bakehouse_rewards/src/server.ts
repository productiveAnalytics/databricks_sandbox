import express from 'express';
import cors from 'cors';
import { WorkspaceClient } from 'databricks-sdk';
import { Client as PgClient } from 'pg';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Databricks SDK for Lakehouse queries
const dbClient = new WorkspaceClient();

// Initialize Lakebase PostgreSQL client
const pgConfig = {
  host: process.env.LAKEBASE_HOST,
  port: parseInt(process.env.LAKEBASE_PORT || '5432'),
  database: process.env.LAKEBASE_DATABASE,
  user: process.env.DATABRICKS_TOKEN ? 'oauth' : process.env.DB_USER,
  password: process.env.DATABRICKS_TOKEN || process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bakehouse Rewards</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 900px; 
            margin: 0 auto;
            background: #f5e6d3;
          }
          h1 { color: #8B4513; }
          .endpoint { 
            background: white; 
            padding: 15px; 
            margin: 10px 0; 
            border-left: 4px solid #8B4513;
            border-radius: 4px;
          }
          .method { 
            display: inline-block;
            padding: 2px 8px;
            background: #8B4513;
            color: white;
            border-radius: 3px;
            font-size: 12px;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <h1>🥐 Bakehouse Rewards</h1>
        <p><strong>TypeScript + Express + AppKit Backend</strong></p>
        <p>Integrated with Lakehouse (Unity Catalog) and Lakebase (Postgres)</p>
        
        <h2>📊 Lakehouse (OLAP) Endpoints:</h2>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/customers</strong> - List top customers by reward points
        </div>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/customers/:email</strong> - Get customer details and rewards
        </div>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/transactions/:email</strong> - Get customer transaction history
        </div>
        
        <h2>💳 Lakebase (OLTP) Endpoints:</h2>
        <div class="endpoint">
          <span class="method">POST</span><strong>/api/redeem</strong> - Redeem reward points
        </div>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/redemptions/:email</strong> - Get redemption history
        </div>
        
        <h2>🔧 System Endpoints:</h2>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/health</strong> - Health check
        </div>
        <div class="endpoint">
          <span class="method">GET</span><strong>/api/config</strong> - Environment configuration
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Bakehouse Rewards API is running',
    timestamp: new Date().toISOString(),
    services: {
      lakehouse: 'configured',
      lakebase: 'configured'
    }
  });
});

// Config check
app.get('/api/config', (req, res) => {
  res.json({
    sql_warehouse_id: process.env.DATABRICKS_SQL_WAREHOUSE_ID || 'not configured',
    lakebase: {
      project: process.env.LAKEBASE_PROJECT || 'not configured',
      branch: process.env.LAKEBASE_BRANCH || 'not configured',
      database: process.env.LAKEBASE_DATABASE || 'not configured',
      host: process.env.LAKEBASE_HOST ? 'configured' : 'not configured'
    }
  });
});

// Lakehouse endpoint: Get top customers by rewards
app.get('/api/customers', async (req, res) => {
  try {
    const warehouseId = process.env.DATABRICKS_SQL_WAREHOUSE_ID;
    if (!warehouseId) {
      return res.status(500).json({ error: 'SQL Warehouse not configured' });
    }

    const result = await dbClient.statementExecution.executeStatement({
      warehouse_id: warehouseId,
      statement: `
        SELECT 
          customer_email,
          total_points,
          points_redeemed,
          points_available,
          total_spent,
          transaction_count,
          last_transaction_date
        FROM workspace.bakehouse_demo.customer_rewards
        ORDER BY total_points DESC
        LIMIT 20
      `
    });

    const customers = result.result?.data_array || [];
    res.json({ customers });
  } catch (error: any) {
    console.error('Lakehouse query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get customer details
app.get('/api/customers/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const warehouseId = process.env.DATABRICKS_SQL_WAREHOUSE_ID;
    
    if (!warehouseId) {
      return res.status(500).json({ error: 'SQL Warehouse not configured' });
    }

    const result = await dbClient.statementExecution.executeStatement({
      warehouse_id: warehouseId,
      statement: `
        SELECT 
          customer_email,
          total_points,
          points_redeemed,
          points_available,
          total_spent,
          transaction_count,
          last_transaction_date
        FROM workspace.bakehouse_demo.customer_rewards
        WHERE customer_email = '${email}'
      `
    });

    const customer = result.result?.data_array?.[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error: any) {
    console.error('Lakehouse query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get customer transactions
app.get('/api/transactions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const warehouseId = process.env.DATABRICKS_SQL_WAREHOUSE_ID;
    
    if (!warehouseId) {
      return res.status(500).json({ error: 'SQL Warehouse not configured' });
    }

    const result = await dbClient.statementExecution.executeStatement({
      warehouse_id: warehouseId,
      statement: `
        SELECT 
          transaction_id,
          transaction_date,
          amount,
          points_earned,
          product_category
        FROM workspace.bakehouse_demo.sales_transactions
        WHERE customer_email = '${email}'
        ORDER BY transaction_date DESC
        LIMIT 50
      `
    });

    const transactions = result.result?.data_array || [];
    res.json({ transactions });
  } catch (error: any) {
    console.error('Lakehouse query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      message: error.message 
    });
  }
});

// Lakebase endpoint: Redeem points
app.post('/api/redeem', async (req, res) => {
  const client = new PgClient(pgConfig);
  
  try {
    const { customer_email, points_redeemed, reward_type } = req.body;
    
    if (!customer_email || !points_redeemed || !reward_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: customer_email, points_redeemed, reward_type' 
      });
    }

    await client.connect();

    const insertQuery = `
      INSERT INTO reward_redemptions 
        (customer_email, points_redeemed, reward_type, redemption_date)
      VALUES ($1, $2, $3, NOW())
      RETURNING redemption_id, redemption_date
    `;
    
    const result = await client.query(insertQuery, [
      customer_email,
      points_redeemed,
      reward_type
    ]);

    const redemption = result.rows[0];
    res.json({ 
      success: true,
      redemption 
    });
  } catch (error: any) {
    console.error('Lakebase insert error:', error);
    res.status(500).json({ 
      error: 'Failed to redeem points',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

// Lakebase endpoint: Get redemption history
app.get('/api/redemptions/:email', async (req, res) => {
  const client = new PgClient(pgConfig);
  
  try {
    const { email } = req.params;
    await client.connect();

    const selectQuery = `
      SELECT 
        redemption_id,
        customer_email,
        points_redeemed,
        reward_type,
        redemption_date
      FROM reward_redemptions
      WHERE customer_email = $1
      ORDER BY redemption_date DESC
      LIMIT 50
    `;
    
    const result = await client.query(selectQuery, [email]);
    
    res.json({ redemptions: result.rows });
  } catch (error: any) {
    console.error('Lakebase query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch redemptions',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

app.listen(port, () => {
  console.log(`🥐 Bakehouse Rewards app running on port ${port}`);
  console.log(`📊 Lakehouse: Unity Catalog via SQL Warehouse`);
  console.log(`💳 Lakebase: PostgreSQL at ${pgConfig.host}`);
});
