// Bakehouse Rewards - AppKit with analytics()
import { createApp, server, analytics } from "@databricks/appkit";

console.log('🚀 Starting Bakehouse Rewards...');

// Create AppKit instance with plugins
const AppKit = await createApp({
  plugins: [server(), analytics({})],
});

console.log('✅ AppKit initialized');
console.log('📊 AppKit.server type:', typeof AppKit.server);
console.log('📊 AppKit.server.extend type:', typeof AppKit.server.extend);

// Register API endpoints
console.log('📝 Calling AppKit.server.extend...');

try {
  AppKit.server.extend((app) => {
    console.log('🎯 INSIDE extend callback - app type:', typeof app);
    console.log('🎯 app.get type:', typeof app.get);
    
    // MOCK Customers endpoint
    app.get("/api/customers", async (_req, res) => {
      console.log('👥 GET /api/customers - MOCK DATA');
      
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
    
    console.log('✅ Registered /api/customers');

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
    
    console.log('✅ Registered /api/transactions/:email');

    // Mock redemptions
    app.get("/api/redemptions/:email", async (_req, res) => {
      console.log('🎁 GET /api/redemptions - MOCK DATA');
      res.json({ redemptions: [] });
    });
    
    console.log('✅ Registered /api/redemptions/:email');

    // Mock redeem
    app.post("/api/redeem", async (_req, res) => {
      console.log('💳 POST /api/redeem - MOCK');
      res.json({ success: true });
    });
    
    console.log('✅ Registered /api/redeem');
    console.log('🎉 ALL ROUTES REGISTERED SUCCESSFULLY');
  });
  
  console.log('✅ extend() call completed');
} catch (error) {
  console.error('❌ ERROR in extend():', error);
}

console.log('🎉 Bakehouse Rewards initialization complete');
