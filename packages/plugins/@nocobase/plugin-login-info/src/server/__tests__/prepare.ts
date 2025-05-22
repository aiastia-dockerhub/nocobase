import { createMockServer, MockServer } from '@nocobase/test';
import PluginLoginInfo from '../..'; // Adjust path if necessary, should point to your plugin's main server export

export async function createApp(): Promise<MockServer> {
  const app = await createMockServer({
    plugins: [
      'error-handler',
      'users', // For currentUser context
      'auth',    // For currentUser context
      'data-source-main', // For systemSettings collection
      'system-settings', // To ensure systemSettings collection and actions are available
      PluginLoginInfo, // Your plugin
    ],
  });

  // Manually register systemSettings collection if not automatically done by system-settings plugin in test
  // This is often needed because plugins might initialize collections in their main load/install sequence
  // which might run differently in a minimal test environment.
  const SystemSettings = app.db.getCollection('systemSettings');
  if (!SystemSettings) {
    app.collection({
      name: 'systemSettings',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'jsonb', name: 'options' },
        // Add other fields if your plugin or tests depend on them
      ],
    });
    await app.db.sync(); // Sync after defining the collection
  }


  return app;
}
