import * as path from 'path';
import * as vscode from 'vscode';

import Browser from './browser';
import BrowserPage from './browserPage';
import TargetTreeProvider from './targetTreeProvider';
import * as EventEmitter from 'eventemitter2';
import { ExtensionConfiguration } from './extensionConfiguration';

export function activate(context: vscode.ExtensionContext) {
  const windowManager = new BrowserViewWindowManager(context.extensionPath);

  windowManager.on('windowOpenRequested', (params) => {
    windowManager.create(params.url);
  });

  vscode.window.registerTreeDataProvider(
    'targetTree',
    new TargetTreeProvider()
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
      windowManager.create(url);
    })
  );

  vscode.debug.registerDebugConfigurationProvider('browser-preview', {
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
      let debugConfig = {
        name: `Browser Preview`,
        type: `chrome`,
        request: 'attach',
        webRoot: config.webRoot,
        pathMapping: config.pathMapping,
        trace: config.trace,
        sourceMapPathOverrides: config.sourceMapPathOverrides,
        urlFilter: '',
        url: '',
        port: 9222
      };

      if (config && config.type === 'browser-preview') {
        if (config.request && config.request === `attach`) {
          debugConfig.name = `Browser Preview: Attach`;
          debugConfig.port = windowManager.getDebugPort();

          vscode.debug.startDebugging(folder, debugConfig);
        } else if (config.request && config.request === `launch`) {
          debugConfig.name = `Browser Preview: Launch`;
          debugConfig.urlFilter = config.url;

          // Launch new preview tab, set url filter, then attach
          var launch = vscode.commands.executeCommand(
            `browser-preview.openPreview`,
            config.url
          );

          launch.then(() => {
            setTimeout(() => {
              debugConfig.port = windowManager.getDebugPort();
              vscode.debug.startDebugging(folder, debugConfig);
            }, 1000);
          });
        }
      } else {
        vscode.window.showErrorMessage('No supported launch config was found.');
      }
      return;
    }
  });

  vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
    if (e.name === `Browser Preview: Launch` && e.configuration.urlFilter) {
      // TODO: Improve this with some unique ID per browser window instead of url, to avoid closing multiple instances
      windowManager.disposeByUrl(e.configuration.urlFilter);
    }
  });
}

class BrowserViewWindowManager extends EventEmitter.EventEmitter2 {
  private openWindows: Set<BrowserViewWindow>;
  private browser: any;
  private config: ExtensionConfiguration;

  constructor(extensionPath: string) {
    super();
    this.openWindows = new Set();
    this.config = {
      extensionPath: extensionPath,
      startUrl: 'http://code.visualstudio.com',
      format: 'jpeg'
    };
    this.refreshSettings();
  }

  private refreshSettings() {
    let extensionSettings = vscode.workspace.getConfiguration(
      'browser-preview'
    );

    if (extensionSettings) {
      let chromeExecutable = extensionSettings.get<string>('chromeExecutable');
      if (chromeExecutable !== undefined) {
        this.config.chromeExecutable = chromeExecutable;
      }

      let startUrl = extensionSettings.get<string>('startUrl');
      if (startUrl !== undefined) {
        this.config.startUrl = startUrl;
      }

      let isVerboseMode = extensionSettings.get<boolean>('verbose');
      if (isVerboseMode !== undefined) {
        this.config.isVerboseMode = isVerboseMode;
      }

      let format = extensionSettings.get<string>('format');
      if (format !== undefined) {
        this.config.format = format.includes('png') ? 'png' : 'jpeg';
      }
    }
  }

  public create(startUrl?: string) {
    this.refreshSettings();

    if (!this.browser) {
      this.browser = new Browser(this.config);
    }

    let window = new BrowserViewWindow(this.config, this.browser);
    window.launch(startUrl);
    window.once('disposed', () => {
      this.openWindows.delete(window);
      if (this.openWindows.size === 0) {
        this.browser.dispose();
        this.browser = null;
      }
    });

    window.on('windowOpenRequested', (params) => {
      this.emit('windowOpenRequested', params);
    });

    this.openWindows.add(window);
  }

  public getDebugPort() {
    return this.browser ? this.browser.remoteDebugPort : null;
  }

  public disposeByUrl(url: string) {
    this.openWindows.forEach((b: BrowserViewWindow) => {
      if (b.config.startUrl == url) {
        b.dispose();
      }
    });
  }
}

class BrowserViewWindow extends EventEmitter.EventEmitter2 {
  private static readonly viewType = 'browser-preview';

  private _panel: vscode.WebviewPanel | null;
  private _disposables: vscode.Disposable[] = [];

  private browserPage: BrowserPage | null;
  private browser: Browser;
  public config: ExtensionConfiguration;

  constructor(config: ExtensionConfiguration, browser: Browser) {
    super();
    this.config = config;
    this._panel = null;
    this.browserPage = null;
    this.browser = browser;
  }

  public async launch(startUrl?: string) {
    try {
      this.browserPage = await this.browser.newPage();
      if (this.browserPage) {
        this.browserPage.else((data: any) => {
          if (this._panel) {
            this._panel.webview.postMessage(data);
          }
        });
      }
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
    }

    let column = vscode.ViewColumn.Two;

    this._panel = vscode.window.createWebviewPanel(
      BrowserViewWindow.viewType,
      'Browser Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.config.extensionPath, 'build'))
        ]
      }
    );

    this._panel.webview.html = this._getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (msg) => {
        if (msg.type === 'extension.updateTitle') {
          if (this._panel) {
            this._panel.title = msg.params.title;
            return;
          }
        }
        if (msg.type === 'extension.windowOpenRequested') {
          this.emit('windowOpenRequested', {
            url: msg.params.url
          });
        }

        if (msg.type === 'extension.windowDialogRequested') {
          const { message, type } = msg.params;
          if (type == 'alert') {
            vscode.window.showInformationMessage(message);
            if (this.browserPage) {
              this.browserPage.send('Page.handleJavaScriptDialog', {
                accept: true
              });
            }
          } else if (type === 'prompt') {
            vscode.window
              .showInputBox({ placeHolder: message })
              .then((result) => {
                if (this.browserPage) {
                  this.browserPage.send('Page.handleJavaScriptDialog', {
                    accept: true,
                    promptText: result
                  });
                }
              });
          } else if (type === 'confirm') {
            vscode.window.showQuickPick(['Ok', 'Cancel']).then((result) => {
              if (this.browserPage) {
                this.browserPage.send('Page.handleJavaScriptDialog', {
                  accept: result === 'Ok'
                });
              }
            });
          }
        }

        if (this.browserPage) {
          try {
            this.browserPage.send(msg.type, msg.params, msg.callbackId);
          } catch (err) {
            vscode.window.showErrorMessage(err);
          }
        }
      },
      null,
      this._disposables
    );

    // Update starturl if requested to launch specifi page.
    if (startUrl) {
      this.config.startUrl = startUrl;
    }

    this._panel.webview.postMessage({
      method: 'extension.appConfiguration',
      result: this.config
    });
  }

  public dispose() {
    if (this._panel) {
      this._panel.dispose();
    }

    if (this.browserPage) {
      this.browserPage.dispose();
      this.browserPage = null;
    }

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }

    this.emit('disposed');
    this.removeAllListeners();
  }

  private _getHtmlForWebview() {
    const manifest = require(path.join(
      this.config.extensionPath,
      'build',
      'asset-manifest.json'
    ));
    const mainScript = manifest['main.js'];
    const mainStyle = manifest['main.css'];
    const runtimeScript = manifest['runtime~main.js'];

    // finding potential list of js chunk files
    const chunkScriptsUri = [];
    for (let key in manifest) {
      if (key.endsWith('.chunk.js') && manifest.hasOwnProperty(key)) {
        // finding their paths on the disk
        let chunkScriptUri = vscode.Uri.file(
          path.join(this.config.extensionPath, 'build', manifest[key])
        ).with({
          scheme: 'vscode-resource'
        });
        // push the chunk Uri to the list of chunks
        chunkScriptsUri.push(chunkScriptUri);
      }
    }

    const runtimescriptPathOnDisk = vscode.Uri.file(
      path.join(this.config.extensionPath, 'build', runtimeScript)
    );
    const runtimescriptUri = runtimescriptPathOnDisk.with({
      scheme: 'vscode-resource'
    });
    const mainScriptPathOnDisk = vscode.Uri.file(
      path.join(this.config.extensionPath, 'build', mainScript)
    );
    const mainScriptUri = mainScriptPathOnDisk.with({
      scheme: 'vscode-resource'
    });

    const stylePathOnDisk = vscode.Uri.file(
      path.join(this.config.extensionPath, 'build', mainStyle)
    );
    const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<base href="${vscode.Uri.file(
          path.join(this.config.extensionPath, 'build')
        ).with({
          scheme: 'vscode-resource'
        })}/">
			</head>

			<body>
				<div id="root"></div>
				<script src="${runtimescriptUri}"></script>
				${chunkScriptsUri.map((item) => `<script src="${item}"></script>`)}
				<script src="${mainScriptUri}"></script>
			</body>
			</html>`;
  }
}
