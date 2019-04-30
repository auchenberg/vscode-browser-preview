import { env } from 'vscode';
import * as path from 'path';
import * as vscode from 'vscode';

export default class DebugProvider {
  private windowManager: any;

  constructor(windowManager: any) {
    this.windowManager = windowManager;

    vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
      if (e.name === `Browser Preview: Launch` && e.configuration.urlFilter) {
        // TODO: Improve this with some unique ID per browser window instead of url, to avoid closing multiple instances
        this.windowManager.disposeByUrl(e.configuration.urlFilter);
      }
    });
    vscode.debug.registerDebugAdapterTrackerFactory('chrome', {
      createDebugAdapterTracker(session): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        const config = session.configuration;

        if (!config._browserPreview || !config._browserPreviewLaunch) {
          return;
        }

        return windowManager.create(config._browserPreviewLaunch).then(() => undefined);
      }
    });
  }

  getProvider(): vscode.DebugConfigurationProvider {
    let manager = this.windowManager;

    return {
      provideDebugConfigurations(
        folder: vscode.WorkspaceFolder | undefined,
        token?: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return Promise.resolve([
          {
            type: 'browser-preview',
            name: 'Browser Preview: Attach',
            request: 'attach'
          },
          {
            type: `browser-preview`,
            request: `launch`,
            name: `Browser Preview: Launch`,
            url: `http://localhost:3000`
          }
        ]);
      },
      resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.DebugConfiguration> {
        if (!config || config.type !== 'browser-preview') {
          return null;
        }

        config.type = 'chrome';
        config._browserPreview = true;

        if (config.request === 'launch') {
          return manager.launch().then(() => {
            config.name = 'Browser Preview: Launch';
            config.request = 'attach';
            config._browserPreviewLaunch = config.url;
            config.urlFilter = config.url;
            config.url = '';
            config.port = manager.getDebugPort();

            if (config.port === null) {
              vscode.window.showErrorMessage('Could not launch Browser Preview window');
            } else {
              return config;
            }
          });
        } else if (config.request === 'attach') {
          config.name = 'Browser Preview: Attach';
          config.port = manager.getDebugPort();
          if (config.port === null) {
            vscode.window.showErrorMessage(
              'No Browser Preview window was found. Open a Browser Preview window or use the "launch" request type.'
            );
          } else {
            return config;
          }
        } else {
          vscode.window.showErrorMessage('No supported launch config was found.');
        }
      }
    };
  }
}
