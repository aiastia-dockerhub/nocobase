import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class PluginLoginInfoServer extends Plugin {
  async load() {
    this.app.resourcer.define({
      name: 'loginInfo',
      actions: {
        async updateRecordNumber(ctx, next) {
          if (!ctx.state.currentUser.isAdmin) {
            ctx.throw(403, 'Forbidden');
          }
          const { recordNumber } = ctx.action.params.values;
          const SystemSetting = this.app.db.getCollection('systemSettings');
          let systemSetting = await SystemSetting.repository.findOne();
          if (!systemSetting) {
            systemSetting = await SystemSetting.repository.create({ values: {} });
          }
          const options = systemSetting.get('options') || {};
          options.pluginLoginInfo = {
            ...options.pluginLoginInfo,
            recordNumber: recordNumber,
          };
          await systemSetting.update({ options });
          ctx.body = systemSetting;
          await next();
        },
      },
    });

    this.app.acl.allow('loginInfo', 'updateRecordNumber', 'loggedIn');

    this.app.pm.addSettings('login-info', {
      title: '{{t("Login Info Settings")}}',
      icon: 'SafetyOutlined',
      scope: 'system',
      components: {
        SettingsComponent: '@nocobase/plugin-login-info/client/SettingsPage',
      },
    });
  }

  async install() {
    const SystemSetting = this.app.db.getCollection('systemSettings');
    if (!SystemSetting) {
      this.app.log.warn('System settings collection not found, skipping login-info default setup');
      return;
    }
    let systemSetting = await SystemSetting.repository.findOne();
    if (!systemSetting) {
      systemSetting = await SystemSetting.repository.create({ values: {} });
    }
    const options = systemSetting.get('options') || {};
    if (!options.pluginLoginInfo || !options.pluginLoginInfo.recordNumber) {
      options.pluginLoginInfo = {
        ...options.pluginLoginInfo,
        recordNumber: '10', // Default to 10 records
      };
      await systemSetting.update({ options });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}
