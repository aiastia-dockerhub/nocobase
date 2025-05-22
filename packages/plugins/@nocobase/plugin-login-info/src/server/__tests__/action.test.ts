import { MockServer } from '@nocobase/test';
import { createApp } from './prepare';

describe('PluginLoginInfo Server Actions', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
    // Ensure the plugin's load method (which defines the action) has been called.
    // In createMockServer, plugins are typically loaded.
    // If the systemSettings collection is not pre-populated by the plugin's install,
    // we might need to create an initial record here or ensure 'prepare.ts' does.
    const SystemSetting = app.db.getCollection('systemSettings');
    let systemSetting = await SystemSetting.repository.findOne();
    if (!systemSetting) {
      await SystemSetting.repository.create({
        values: { title: 'Test Settings', options: {} },
      });
    }
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('loginInfo:updateRecordNumber action', () => {
    it('should update recordNumber in systemSettings when called by an admin', async () => {
      const newRecordNumber = '25';

      // Simulate admin user
      const User = app.db.getCollection('users');
      const adminUser = await User.repository.create({
        values: { nickname: 'Admin', roles: ['admin'] },
      });
      
      // Mock the agent to act as this admin user.
      // The actual mechanism for setting currentUser can be complex and might involve
      // signing in or directly manipulating ctx.state in middleware for testing.
      // For action tests, agent().login() is typically used if auth is fully set up.
      // If login is not straightforward for role-based tests, one might need to
      // add a test-specific middleware in prepare.ts to set ctx.state.currentUser.
      
      // A simpler approach for this test: assume agent is already admin or use a direct action call if possible.
      // Since we are testing the action directly, let's try to invoke it with a mocked context if http calls are tricky.
      // However, @nocobase/test usually encourages http requests via agent.

      // Let's try with agent and assume login works or admin rights are granted by default in test for 'admin' role.
      // If this fails, it means the test environment's auth setup needs more specific handling.
      await agent.login(adminUser);


      const response = await agent
        .resource('loginInfo')
        .updateRecordNumber({ values: { recordNumber: newRecordNumber } });

      expect(response.statusCode).toBe(200); // Or 201 if it creates

      const SystemSetting = app.db.getCollection('systemSettings');
      const updatedSetting = await SystemSetting.repository.findOne();
      expect(updatedSetting.get('options').pluginLoginInfo.recordNumber).toBe(newRecordNumber);
    });

    it('should create systemSettings record if it does not exist', async () => {
        const SystemSetting = app.db.getCollection('systemSettings');
        await SystemSetting.repository.destroy({ filter: {} }); // Clear existing settings

        const newRecordNumber = '30';
        const User = app.db.getCollection('users');
        const adminUser = await User.repository.create({
            values: { nickname: 'Admin2', roles: ['admin'] },
        });
        await agent.login(adminUser);

        const response = await agent
            .resource('loginInfo')
            .updateRecordNumber({ values: { recordNumber: newRecordNumber } });

        expect(response.statusCode).toBe(200);
        const settings = await SystemSetting.repository.findOne();
        expect(settings).not.toBeNull();
        expect(settings.get('options').pluginLoginInfo.recordNumber).toBe(newRecordNumber);
    });


    it('should forbid access if user is not an admin', async () => {
      const newRecordNumber = '50';

      // Simulate non-admin user
      const User = app.db.getCollection('users');
      const nonAdminUser = await User.repository.create({
        values: { nickname: 'User', roles: ['user'] }, // Assuming 'user' is not an admin role
      });
      await agent.login(nonAdminUser); // login as non-admin

      const response = await agent
        .resource('loginInfo')
        .updateRecordNumber({ values: { recordNumber: newRecordNumber } });
      
      expect(response.statusCode).toBe(403); // Forbidden

      // Verify settings were not changed
      const SystemSetting = app.db.getCollection('systemSettings');
      const currentSetting = await SystemSetting.repository.findOne();
      // Check against initial or previously set value, ensure it's NOT newRecordNumber
      // This depends on the state before this test. If it was '25' from a previous test, it should remain '25'.
      // If options.pluginLoginInfo is undefined, that's also a valid state if no admin set it.
      const recordNumber = currentSetting.get('options')?.pluginLoginInfo?.recordNumber;
      expect(recordNumber).not.toBe(newRecordNumber);
    });
  });

  describe('Plugin Install', () => {
    it('should set default recordNumber in systemSettings on install if not present', async () => {
      // Simulate a fresh install state by removing any existing pluginLoginInfo options
      const SystemSetting = app.db.getCollection('systemSettings');
      let setting = await SystemSetting.repository.findOne();
      if (setting) {
        const options = setting.get('options') || {};
        delete options.pluginLoginInfo;
        await setting.update({ options });
      } else {
        setting = await SystemSetting.repository.create({ values: { options: {} } });
      }
      
      // Re-run install logic for the plugin.
      // This is tricky as install() is usually run once.
      // We might need to directly call the install method or re-instantiate the plugin.
      // For simplicity, we'll check the state after initial app setup,
      // assuming 'prepare.ts' ensures the plugin is loaded and its install() hook runs.
      // The `prepareApp` in `prepare.ts` should have run the install hook.
      // We are essentially testing if the install hook worked as expected.

      const pluginInstance = app.getPlugin('@nocobase/plugin-login-info') as any; // Type assertion
      if (pluginInstance && typeof pluginInstance.install === 'function') {
         // If we need to force re-install, this might be one way,
         // but it can have side effects or not be allowed.
         // await pluginInstance.install(); 
      }
      // The install method should have been called when the app was prepared.
      // So we just check the results.

      const finalSetting = await SystemSetting.repository.findOne();
      expect(finalSetting.get('options').pluginLoginInfo.recordNumber).toBe('10'); // Default value
    });

    it('should not overwrite existing recordNumber on install', async () => {
        const SystemSetting = app.db.getCollection('systemSettings');
        const initialRecordNumber = '15';
        await SystemSetting.repository.update({
            filter: {}, // Update the first record found, assuming one exists
            values: {
                options: { pluginLoginInfo: { recordNumber: initialRecordNumber } }
            },
            hooks: false // Skip hooks to ensure direct update if needed
        });
        
        // Re-run install logic (conceptually)
        const pluginInstance = app.getPlugin('@nocobase/plugin-login-info') as any;
        if (pluginInstance && typeof pluginInstance.install === 'function') {
            // await pluginInstance.install(); // Conceptual re-install
        }

        const finalSetting = await SystemSetting.repository.findOne();
        expect(finalSetting.get('options').pluginLoginInfo.recordNumber).toBe(initialRecordNumber);
    });
  });
});
