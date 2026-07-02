// Bakehouse Rewards - AppKit with analytics()
import { createApp, server, analytics } from "@databricks/appkit";

await createApp({
  plugins: [server(), analytics({})],
  onPluginsReady(appkit) {
    console.log('✅ Plugins ready, registering routes...');
    
    appkit.server.extend((app) => {
      // MOCK Customers endpoint for testing UI
      app.get("/api/customers", async (_req, res) => {
        console.log('👥 GET /api/customers - MOCK DATA');
        
        // Mock customer data with correct field names for frontend
        const mockCustomers = [
          {
            customer_email: "alice@example.com",
            total_points: 1250,
            points_redeemed: 500,
            points_available: 750,
            total_spent: 5000.00,
            transaction_count: 42,
            last_transaction_date: "2024-01-15"
          },
          {
            customer_email: "bob@example.com",
            total_points: 980,
            points_redeemed: 200,
            points_available: 780,
            total_spent: 3920.00,
            transaction_count: 28,
            last_transaction_date: "2024-01-14"
          },
          {
            customer_email: "charlie@example.com",
            total_points: 450,
            points_redeemed: 100,
            points_available: 350,
            total_spent: 1800.00,
            transaction_count: 15,
            last_transaction_date: "2024-01-13"
          }
        ];
        
        console.log(`✅ Returning ${mockCustomers.length} mock customers`);
        res.json({ customers: mockCustomers });
      });

      // MOCK Transactions endpoint
      app.get("/api/transactions/:email", async (req, res) => {
        console.log(`📋 GET /api/transactions/${req.params.email} - MOCK DATA`);
        
        const mockTransactions = [
          {
            transaction_id: "TXN001",
            transaction_date: "2024-01-15",
            amount: 150.00,
            points_earned: 15,
            product_category: "Pastries"
          },
          {
            transaction_id: "TXN002",
            transaction_date: "2024-01-10",
            amount: 85.50,
            points_earned: 9,
            product_category: "Breads"
          }
        ];
        
        console.log(`✅ Returning ${mockTransactions.length} mock transactions`);
        res.json({ transactions: mockTransactions });
      });

      // Mock Lakebase endpoints
      app.get("/api/redemptions/:email", (_req, res) => {
        console.log('🎁 GET /api/redemptions - MOCK DATA');
        res.json({ redemptions: [] });
      });

      app.post("/api/redeem", (_req, res) => {
        console.log('💳 POST /api/redeem - MOCK');
        res.json({ success: true });
      });

      console.log('✅ Routes registered (MOCK MODE)');
    });
  },
});

console.log('🎉 Bakehouse Rewards ready (MOCK MODE)');
