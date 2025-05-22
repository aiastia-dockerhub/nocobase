import React from 'react';
import { Plugin } from '@nocobase/client';
import SettingsPage from './SettingsPage';
import locales from './locale';
import RecordNumberDisplay from './RecordNumberDisplay';

export class PluginLoginInfoClient extends Plugin {
  async load() {
    this.app.i18n.addLocales(locales);

    this.app.pluginUiManager.addComponents({
      SettingsPage,
      RecordNumberDisplay, // Registering it just in case, though direct usage is planned
    });

    // Attempt to enhance AuthLayout
    // We need to ensure this runs after plugin-auth has registered its components.
    // Using a slight delay or a lifecycle hook if available.
    // For now, let's assume a simple override attempt.
    // Note: NocoBase's component registration might not support easy direct overriding
    // of components like AuthLayout from another plugin without specific support for it.
    // This is an optimistic attempt for a cleaner integration.

    const OriginalAuthLayout = this.app.components.get('AuthLayout');

    if (OriginalAuthLayout) {
      const EnhancedAuthLayout = (props) => {
        return (
          <>
            <OriginalAuthLayout {...props} />
            <RecordNumberDisplay />
          </>
        );
      };
      this.app.components.add('AuthLayout', EnhancedAuthLayout, { override: true });
    } else {
      // Fallback to DOM manipulation if AuthLayout is not found or override fails
      // This part needs to be robust and ideally run once the login page is fully rendered.
      // A MutationObserver or a simple setInterval check might be needed for robustness.
      // For now, we'll try a simple append after a delay.
      this.appendRecordNumberDisplay();
    }
  }

  appendRecordNumberDisplay() {
    const interval = setInterval(() => {
      // The AuthLayout's structure:
      // <div style="max-width: 320px; margin: 0 auto; padding-top: 20vh;">
      //   ...
      //   <div class="css-xxxx"> /* PoweredBy container */
      //     <PoweredBy />
      //   </div>
      // </div>
      // We aim to insert RecordNumberDisplay before the PoweredBy container.
      const poweredByDiv = document.querySelector('div[class*="css-"] > a[href*="nocobase.com"]');
      if (poweredByDiv) {
        const authLayoutContainer = poweredByDiv.closest('div[style*="max-width: 320px"]'); // Find the main container
        if (authLayoutContainer) {
          const poweredByContainer = poweredByDiv.parentElement; // The div directly containing PoweredBy
          
          let recordDisplayRoot = document.getElementById('record-number-display-root');
          if (!recordDisplayRoot) {
            recordDisplayRoot = document.createElement('div');
            recordDisplayRoot.id = 'record-number-display-root';
            // Insert before the PoweredBy's container
            if (poweredByContainer && poweredByContainer.parentElement === authLayoutContainer) {
                 authLayoutContainer.insertBefore(recordDisplayRoot, poweredByContainer);
            } else {
              // Fallback: append to the main auth layout container if specific PoweredBy container not found as expected
              authLayoutContainer.appendChild(recordDisplayRoot);
            }
          }
          
          const root = (this.app as any).reactRoots?.get(recordDisplayRoot) || (this.app as any).createRoot(recordDisplayRoot);
          root.render(React.createElement(RecordNumberDisplay, { app: this.app }));

          clearInterval(interval);
        }
      }
    }, 500);

    // Clear interval after some time to avoid infinite loops if element not found
    setTimeout(() => clearInterval(interval), 10000);
  }
}

export default PluginLoginInfoClient;
