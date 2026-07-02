import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve React frontend for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Bakehouse Rewards API is running',
    timestamp: new Date().toISOString(),
    services: {
      lakehouse: 'ready (mock data)',
      lakebase: 'ready (mock data)'
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

// Lakehouse endpoint: Get top customers (MOCK DATA)
app.get('/api/customers', async (req, res) => {
  try {
    // Mock data for now - will be replaced with real Databricks SQL queries
    const customers = [
      {
        customer_email: 'alice@example.com',
        total_points: 1250,
        points_redeemed: 500,
        points_available: 750,
        total_spent: 5000.00,
        transaction_count: 42,
        last_transaction_date: '2024-01-15'
      },
      {
        customer_email: 'bob@example.com',
        total_points: 980,
        points_redeemed: 200,
        points_available: 780,
        total_spent: 3920.00,
        transaction_count: 28,
        last_transaction_date: '2024-01-14'
      }
    ];
    
    res.json({ customers, note: 'Mock data - real Databricks integration coming next' });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get customer details (MOCK DATA)
app.get('/api/customers/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Mock data
    const customer = {
      customer_email: email,
      total_points: 1250,
      points_redeemed: 500,
      points_available: 750,
      total_spent: 5000.00,
      transaction_count: 42,
      last_transaction_date: '2024-01-15'
    };

    res.json({ customer, note: 'Mock data - real Databricks integration coming next' });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch customer',
      message: error.message 
    });
  }
});

// Lakehouse endpoint: Get transactions (MOCK DATA)
app.get('/api/transactions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Mock data
    const transactions = [
      {
        transaction_id: 'TXN001',
        transaction_date: '2024-01-15',
        amount: 125.50,
        points_earned: 125,
        product_category: 'Pastries'
      },
      {
        transaction_id: 'TXN002',
        transaction_date: '2024-01-10',
        amount: 45.00,
        points_earned: 45,
        product_category: 'Coffee'
      }
    ];

    res.json({ transactions, note: 'Mock data - real Databricks integration coming next' });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      message: error.message 
    });
  }
});

// Lakebase endpoint: Redeem points (MOCK)
app.post('/api/redeem', async (req, res) => {
  try {
    const { customer_email, points_redeemed, reward_type } = req.body;
    
    if (!customer_email || !points_redeemed || !reward_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: customer_email, points_redeemed, reward_type' 
      });
    }

    // Mock redemption
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
      note: 'Mock data - real Lakebase integration coming next'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to redeem points',
      message: error.message 
    });
  }
});

// Lakebase endpoint: Get redemption history (MOCK)
app.get('/api/redemptions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Mock data
    const redemptions = [
      {
        redemption_id: 'RED001',
        customer_email: email,
        points_redeemed: 500,
        reward_type: 'Free Coffee',
        redemption_date: '2024-01-12'
      }
    ];

    res.json({ redemptions, note: 'Mock data - real Lakebase integration coming next' });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch redemptions',
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Bakehouse Rewards app running on port ${port}`);
  console.log('Note: Currently using mock data. Database integration will be added next.');
});