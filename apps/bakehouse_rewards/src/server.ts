// Minimal AppKit test - server only, no analytics
import { createApp, server } from "@databricks/appkit";

console.log('🚀 Starting minimal AppKit test...');

await createApp({
  plugins: [server()],
  onPluginsReady(appkit) {
    console.log('✅ Plugins ready!');
    
    appkit.server.extend((app) => {
      console.log('🎯 Registering test endpoint...');
      
      app.get("/api/test", async (_req, res) => {
        console.log('📋 GET /api/test');
        res.json({ status: "ok", message: "Minimal AppKit working!" });
      });
      
      console.log('✅ Test endpoint registered');
    });
  },
});

console.log('🎉 Minimal AppKit ready!');
