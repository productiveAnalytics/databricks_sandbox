// Bakehouse Rewards - AppKit with analytics()
// Note: lakebase() plugin will be added when implementing real redemptions
import { createApp, server, analytics } from "@databricks/appkit";

// Create AppKit instance with plugins
const AppKit = await createApp({
  plugins: [server(), analytics({})],
});

console.log('✅ AppKit initialized with analytics() plugin');

// Register API endpoints
console.log('📝 Registering API routes...');
AppKit.server.extend((app) => {
  // MOCK Customers endpoint for testing UI
  // TODO: Replace with real Unity Catalog query
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

  // MOCK Transactions endpoint
  // TODO: Replace with real Unity Catalog query
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

  // Mock Lakebase redemptions endpoint
  // TODO: Replace with real Lakebase query
  app.get("/api/redemptions/:email", async (_req, res) => {
    console.log('🎁 GET /api/redemptions - MOCK DATA');
    res.json({ redemptions: [] });
  });

  // Mock redeem endpoint
  // TODO: Replace with real Lakebase INSERT
  app.post("/api/redeem", async (_req, res) => {
    console.log('💳 POST /api/redeem - MOCK');
    res.json({ success: true });
  });
  
  console.log('✅ Routes registered successfully (MOCK MODE)');
});

console.log('🎉 Bakehouse Rewards ready (MOCK MODE)');
