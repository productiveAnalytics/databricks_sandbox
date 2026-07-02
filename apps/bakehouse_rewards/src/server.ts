// Bakehouse Rewards - AppKit with analytics() for Unity Catalog
import { createApp, server, analytics } from "@databricks/appkit";

console.log('🚀 Starting Bakehouse Rewards with Unity Catalog integration...');

// Create AppKit instance with plugins and onPluginsReady callback
await createApp({
  plugins: [server(), analytics({})],
  onPluginsReady(appkit) {
    console.log('✅ Plugins ready! analytics() initialized');
    console.log('📊 analytics available:', typeof appkit.analytics);
    console.log('🔧 Registering routes with Unity Catalog...');
    
    appkit.server.extend((app) => {
      console.log('🎯 Registering API endpoints...');
      
      // Get all customers from Unity Catalog
      app.get("/api/customers", async (_req, res) => {
        console.log('👥 GET /api/customers - Unity Catalog');
        try {
          const { rows } = await appkit.analytics.query(`
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
          
          // Map UC column names to frontend expected names
          const customers = rows.map(row => ({
            customer_email: row.email_address,
            total_points: row.points_available,
            points_redeemed: 0,
            points_available: row.points_available,
            total_spent: row.total_spend,
            transaction_count: row.transaction_count,
            last_transaction_date: row.last_purchase_date
          }));
          
          console.log(`✅ Retrieved ${customers.length} customers from Unity Catalog`);
          res.json({ customers });
        } catch (error) {
          console.error('❌ Error fetching customers:', error.message);
          res.status(500).json({ error: error.message, customers: [] });
        }
      });

      // Get transactions for a specific customer
      app.get("/api/transactions/:email", async (req, res) => {
        console.log(`📋 GET /api/transactions/${req.params.email} - Unity Catalog`);
        try {
          const { rows } = await appkit.analytics.query(`
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
            LIMIT 50
          `);
          
          // Map to frontend expected format
          const transactions = rows.map(row => ({
            transaction_id: String(row.transactionID),
            transaction_date: row.dateTime,
            amount: row.totalPrice,
            points_earned: Math.floor(row.totalPrice / 10),
            product_category: row.product
          }));
          
          console.log(`✅ Retrieved ${transactions.length} transactions`);
          res.json({ transactions });
        } catch (error) {
          console.error('❌ Error fetching transactions:', error.message);
          res.status(500).json({ error: error.message, transactions: [] });
        }
      });

      // Mock redemptions endpoint
      app.get("/api/redemptions/:email", async (_req, res) => {
        console.log('🎁 GET /api/redemptions - MOCK');
        res.json({ redemptions: [] });
      });

      // Mock redeem endpoint
      app.post("/api/redeem", async (_req, res) => {
        console.log('💳 POST /api/redeem - MOCK');
        res.json({ success: true });
      });
      
      console.log('✅ ALL ROUTES REGISTERED - analytics() only');
    });
  },
});

console.log('🎉 Bakehouse Rewards ready with Unity Catalog!');
