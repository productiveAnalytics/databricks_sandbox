// AppKit with analytics() plugin
import { createApp, server, analytics } from "@databricks/appkit";

console.log('🚀 Starting AppKit with analytics()...');

await createApp({
  plugins: [
    server(),
    analytics({})
  ],
  onPluginsReady(appkit) {
    console.log('✅ Plugins ready!');
    console.log('📊 analytics type:', typeof appkit.analytics);
    console.log('📊 analytics.query type:', typeof appkit.analytics?.query);
    
    appkit.server.extend((app) => {
      console.log('🎯 Registering endpoints...');
      
      // Simple test endpoint
      app.get("/api/test", async (_req, res) => {
        console.log('📋 GET /api/test');
        res.json({ status: "ok", analytics_available: typeof appkit.analytics === 'object' });
      });
      
      // Unity Catalog customers endpoint
      app.get("/api/customers", async (_req, res) => {
        console.log('👥 GET /api/customers');
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
            LIMIT 10
          `);
          
          const customers = rows.map(row => ({
            customer_email: row.email_address,
            total_points: row.points_available,
            points_redeemed: 0,
            points_available: row.points_available,
            total_spent: row.total_spend,
            transaction_count: row.transaction_count,
            last_transaction_date: row.last_purchase_date
          }));
          
          console.log(`✅ Retrieved ${customers.length} customers`);
          res.json({ customers });
        } catch (error) {
          console.error('❌ Error:', error.message);
          res.status(500).json({ error: error.message, customers: [] });
        }
      });
      
      console.log('✅ Endpoints registered');
    });
  },
});

console.log('🎉 AppKit ready!');
