import express from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bakehouse Rewards API</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
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
        </style>
      </head>
      <body>
        <h1>🥐 Bakehouse Rewards API</h1>
        <p>TypeScript + Express backend is running!</p>
        <h2>Available Endpoints:</h2>
        <div class="endpoint"><strong>GET /</strong> - This page</div>
        <div class="endpoint"><strong>GET /api/health</strong> - Health check</div>
        <div class="endpoint"><strong>GET /api/config</strong> - Environment config</div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Bakehouse Rewards API is running',
    timestamp: new Date().toISOString()
  });
});

// Config check
app.get('/api/config', (req, res) => {
  res.json({
    sql_warehouse: process.env.SQL_WAREHOUSE_ID || 'not configured',
    lakebase_project: process.env.LAKEBASE_PROJECT || 'not configured',
    lakebase_branch: process.env.LAKEBASE_BRANCH || 'not configured'
  });
});

app.listen(port, () => {
  console.log(`Bakehouse Rewards app running on port ${port}`);
});