import express from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';
import { execSync } from 'child_process';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Lakebase PostgreSQL connection
const getLakebaseConnection = () => {
  try {
    // Generate OAuth token using Databricks CLI
    const endpoint = `projects/${process.env.LAKEBASE_PROJECT}/branches/${process.env.LAKEBASE_BRANCH}/endpoints/primary`;
    const credentialsJson = execSync(
      `databricks postgres generate-db-token --endpoint "${endpoint}" --output json`,
      { encoding: 'utf-8' }
    );
    const credentials = JSON.parse(credentialsJson);
    
    return new Pool({
      host: process.env.LAKEBASE_HOST,
      port: parseInt(process.env.LAKEBASE_PORT || '5432'),
      database: process.env.LAKEBASE_DATABASE,
      user: credentials.postgres_username,
      password: credentials.postgres_password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  } catch (error) {
    console.error('Failed to create Lakebase connection:', error);
    return null;
  }
};

// SQL Warehouse connection using Databricks SQL
const querySQLWarehouse = async (query: string) => {
  try {
    const result = execSync(
      `databricks sql execute --warehouse-id "${process.env.DATABRICKS_SQL_WAREHOUSE_ID}" --query "${query.replace(/"/g, '\\"')}" --output json`,
      { encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('SQL Warehouse query failed:', error);
    throw error;
  }
};

// API Routes

// Get all customers with rewards
app.get('/api/customers', async (req, res) => {
  try {
    const query = `
      SELECT 
        customerID,
        customer_name,
        email_address,
        points_available,
        total_spend,
        transaction_count,
        last_purchase_date
      FROM workspace.bakehouse_demo.customer_rewards
      ORDER BY points_available DESC
      LIMIT 20
    `;
    
    const result = await querySQLWarehouse(query);
    res.json(result.rows || []);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer details with net points (historical - redeemed)
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    // Get historical points from Lakehouse
    const customerQuery = `
      SELECT * FROM workspace.bakehouse_demo.customer_rewards
      WHERE customerID = ${customerId}
    `;
    const customerResult = await querySQLWarehouse(customerQuery);
    const customer = customerResult.rows?.[0];
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get redeemed points from Lakebase
    const pool = getLakebaseConnection();
    if (pool) {
      const redemptionsResult = await pool.query(
        'SELECT SUM(points_redeemed) as total_redeemed FROM reward_redemptions WHERE customer_id = $1',
        [customerId]
      );
      const totalRedeemed = parseInt(redemptionsResult.rows[0]?.total_redeemed || '0');
      
      // Calculate net available points
      customer.net_points = customer.points_available - totalRedeemed;
      customer.redeemed_points = totalRedeemed;
      
      await pool.end();
    } else {
      customer.net_points = customer.points_available;
      customer.redeemed_points = 0;
    }
    
    res.json(customer);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent transactions for a customer
app.get('/api/customers/:id/transactions', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    const query = `
      SELECT transactionID, product, quantity, totalPrice, dateTime
      FROM workspace.bakehouse_demo.sales_transactions
      WHERE customerID = ${customerId}
      ORDER BY dateTime DESC
      LIMIT 10
    `;
    
    const result = await querySQLWarehouse(query);
    res.json(result.rows || []);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get redemption history for a customer
app.get('/api/customers/:id/redemptions', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const pool = getLakebaseConnection();
    
    if (!pool) {
      return res.status(500).json({ error: 'Lakebase connection failed' });
    }
    
    const result = await pool.query(
      'SELECT * FROM reward_redemptions WHERE customer_id = $1 ORDER BY redeemed_at DESC LIMIT 20',
      [customerId]
    );
    
    await pool.end();
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Redeem a reward
app.post('/api/redeem', async (req, res) => {
  try {
    const { customer_id, reward_name, points_redeemed } = req.body;
    
    if (!customer_id || !reward_name || !points_redeemed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const pool = getLakebaseConnection();
    if (!pool) {
      return res.status(500).json({ error: 'Lakebase connection failed' });
    }
    
    // Insert redemption record
    const result = await pool.query(
      'INSERT INTO reward_redemptions (customer_id, reward_name, points_redeemed) VALUES ($1, $2, $3) RETURNING *',
      [customer_id, reward_name, points_redeemed]
    );
    
    await pool.end();
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Bakehouse Rewards app running on port ${port}`);
});
