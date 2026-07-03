// Bakehouse Rewards - Full Lakehouse + Lakebase integration
import { createApp, server, analytics, lakebase } from "@databricks/appkit";

console.log('🚀 Starting Bakehouse Rewards with Lakehouse + Lakebase...');

await createApp({
  plugins: [server(), analytics({}), lakebase({})],
  onPluginsReady(appkit) {
    console.log('✅ Plugins ready - analytics() and lakebase() initialized');
    
    // Initialize Lakebase schema and tables
    (async () => {
      try {
        console.log('🔧 Initializing Lakebase schema...');
        
        // Create rewards schema if not exists
        await appkit.lakebase.query(`
          CREATE SCHEMA IF NOT EXISTS rewards;
        `);
        
        // Create redemptions table
        await appkit.lakebase.query(`
          CREATE TABLE IF NOT EXISTS rewards.redemptions (
            redemption_id VARCHAR(50) PRIMARY KEY,
            customer_email VARCHAR(255) NOT NULL,
            points_redeemed INTEGER NOT NULL,
            reward_type VARCHAR(100) NOT NULL,
            redemption_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Create index for fast lookups
        await appkit.lakebase.query(`
          CREATE INDEX IF NOT EXISTS idx_redemptions_customer 
            ON rewards.redemptions(customer_email);
        `);
        
        console.log('✅ Lakebase schema initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Lakebase:', error.message);
      }
    })();
    
    appkit.server.extend((app) => {
      console.log('🎯 Registering API endpoints...');
      
      // Get all customers from Unity Catalog with redeemed points from Lakebase
      app.get("/api/customers", async (_req, res) => {
        console.log('👥 GET /api/customers');
        try {
          // Fetch customers from Unity Catalog
          const result = await appkit.analytics.query(`
            SELECT 
              email_address,
              points_available,
              total_spend,
              transaction_count,
              last_purchase_date
            FROM workspace.bakehouse_demo.customer_rewards
            ORDER BY points_available DESC
            LIMIT 50
          `);
          
          const rows = result?.rows || result?.data || result || [];
          
          if (!Array.isArray(rows)) {
            console.error('❌ Unexpected result format:', result);
            return res.status(500).json({ 
              error: 'Unexpected query result format', 
              customers: [] 
            });
          }
          
          // Fetch total redeemed points per customer from Lakebase
          const redemptionsResult = await appkit.lakebase.query(`
            SELECT 
              customer_email,
              COALESCE(SUM(points_redeemed), 0) as total_redeemed
            FROM rewards.redemptions
            GROUP BY customer_email
          `);
          
          const redemptionsMap = new Map();
          (redemptionsResult?.rows || []).forEach(row => {
            redemptionsMap.set(row.customer_email, parseInt(row.total_redeemed) || 0);
          });
          
          // Calculate net available points
          const customers = rows.map(row => {
            const earnedPoints = row.points_available || 0;
            const redeemedPoints = redemptionsMap.get(row.email_address) || 0;
            const availablePoints = Math.max(0, earnedPoints - redeemedPoints);
            
            return {
              customer_email: row.email_address,
              total_points: earnedPoints,
              points_redeemed: redeemedPoints,
              points_available: availablePoints,
              total_spent: row.total_spend,
              transaction_count: row.transaction_count,
              last_transaction_date: row.last_purchase_date
            };
          });
          
          console.log(`✅ Retrieved ${customers.length} customers (Lakehouse + Lakebase integrated)`);
          res.json({ customers });
        } catch (error) {
          console.error('❌ Error fetching customers:', error.message);
          res.status(500).json({ error: error.message, customers: [] });
        }
      });

      // Get transactions for a specific customer (Unity Catalog)
      // Query param: limit=-1 for all rows, limit=N for specific count (default 5)
      app.get("/api/transactions/:email", async (req, res) => {
        const limit = parseInt(req.query.limit as string) || 5;
        const limitClause = limit === -1 ? '' : `LIMIT ${limit}`;
        
        console.log(`📋 GET /api/transactions/${req.params.email}?limit=${limit}`);
        try {
          const result = await appkit.analytics.query(`
            SELECT 
              t.transactionID,
              t.dateTime,
              t.totalPrice,
              t.product
            FROM workspace.bakehouse_demo.sales_transactions t
            INNER JOIN workspace.bakehouse_demo.sales_customers c
              ON t.customerID = c.customerID
            WHERE c.email_address = '${req.params.email}'
            ORDER BY t.dateTime DESC
            ${limitClause}
          `);
          
          const rows = result?.rows || result?.data || result || [];
          
          const transactions = rows.map(row => ({
            transaction_id: String(row.transactionID),
            transaction_date: row.dateTime,
            amount: row.totalPrice,
            points_earned: Math.floor(row.totalPrice / 10),
            product_category: row.product
          }));
          
          console.log(`✅ Retrieved ${transactions.length} transactions (limit: ${limit})`);
          res.json({ transactions });
        } catch (error) {
          console.error('❌ Error fetching transactions:', error.message);
          res.status(500).json({ error: error.message, transactions: [] });
        }
      });

      // Get redemptions for a specific customer (Lakebase)
      app.get("/api/redemptions/:email", async (req, res) => {
        console.log(`🎁 GET /api/redemptions/${req.params.email}`);
        try {
          const result = await appkit.lakebase.query(`
            SELECT 
              redemption_id,
              customer_email,
              points_redeemed,
              reward_type,
              redemption_date,
              created_at
            FROM rewards.redemptions
            WHERE customer_email = $1
            ORDER BY redemption_date DESC
            LIMIT 50
          `, [req.params.email]);
          
          const rows = result?.rows || [];
          
          const redemptions = rows.map(row => ({
            redemption_id: row.redemption_id,
            redemption_date: row.redemption_date,
            reward_type: row.reward_type,
            points_redeemed: row.points_redeemed
          }));
          
          console.log(`✅ Retrieved ${redemptions.length} redemptions from Lakebase`);
          res.json({ redemptions });
        } catch (error) {
          console.error('❌ Error fetching redemptions:', error.message);
          res.status(500).json({ error: error.message, redemptions: [] });
        }
      });

      // Redeem points (Lakebase + Lakehouse validation)
      app.post("/api/redeem", async (req, res) => {
        console.log('💳 POST /api/redeem');
        try {
          const { customer_email, points_redeemed, reward_type } = req.body;
          
          if (!customer_email || !points_redeemed || !reward_type) {
            return res.status(400).json({ 
              error: 'Missing required fields: customer_email, points_redeemed, reward_type' 
            });
          }
          
          // Validate customer has enough points (check Unity Catalog)
          const customerResult = await appkit.analytics.query(`
            SELECT points_available
            FROM workspace.bakehouse_demo.customer_rewards
            WHERE email_address = '${customer_email}'
          `);
          
          const earnedPoints = customerResult?.rows?.[0]?.points_available || 0;
          
          // Get total redeemed points from Lakebase
          const redemptionsResult = await appkit.lakebase.query(`
            SELECT COALESCE(SUM(points_redeemed), 0) as total_redeemed
            FROM rewards.redemptions
            WHERE customer_email = $1
          `, [customer_email]);
          
          const previouslyRedeemed = parseInt(redemptionsResult?.rows?.[0]?.total_redeemed || 0);
          const availablePoints = earnedPoints - previouslyRedeemed;
          
          if (availablePoints < points_redeemed) {
            return res.status(400).json({
              success: false,
              error: `Insufficient points. Available: ${availablePoints}, Requested: ${points_redeemed}`
            });
          }
          
          // Generate redemption ID
          const redemption_id = `RED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Insert redemption record in Lakebase
          await appkit.lakebase.query(`
            INSERT INTO rewards.redemptions 
              (redemption_id, customer_email, points_redeemed, reward_type, redemption_date)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [redemption_id, customer_email, points_redeemed, reward_type]);
          
          const newAvailablePoints = availablePoints - points_redeemed;
          
          console.log(`✅ Redemption created: ${redemption_id} for ${customer_email} (${availablePoints} -> ${newAvailablePoints})`);
          res.json({ 
            success: true, 
            message: `Successfully redeemed ${points_redeemed} points for ${reward_type}`,
            redemption_id,
            new_available_points: newAvailablePoints
          });
        } catch (error) {
          console.error('❌ Error processing redemption:', error.message);
          res.status(500).json({ error: error.message, success: false });
        }
      });
      
      console.log('✅ All routes registered successfully');
    });
  },
});

console.log('🎉 Bakehouse Rewards ready with Lakehouse + Lakebase!');
