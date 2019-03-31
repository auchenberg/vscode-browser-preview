import * as path from 'path';
import * as vscode from 'vscode';

import Browser from './browser';
import BrowserPage from './browserPage';
import TargetTreeProvider from './targetTreeProvider';
import * as EventEmitter from 'eventemitter2';
import { ExtensionConfiguration } from './extensionConfiguration';
import ContentProvider from './contentProvider';
import DebugProvider from './debugProvider';

export function activate(context: vscode.ExtensionContext) {
  const windowManager = new BrowserViewWindowManager(context.extensionPath);
  const debugProvider = new DebugProvider(windowManager);

  windowManager.on('windowOpenRequested', (params) => {
    windowManager.create(params.url);
  });

  vscode.window.registerTreeDataProvider('targetTree', new TargetTreeProvider());
  vscode.debug.registerDebugConfigurationProvider('browser-preview', debugProvider.getProvider());

  context.subscriptions.push(
    vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
      windowManager.create(url);
    })
  );
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
    let extensionSettings = vscode.workspace.getConfiguration('browser-preview');

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
  private contentProvider: ContentProvider;

  private browserPage: BrowserPage | null;
  private browser: Browser;
  public config: ExtensionConfiguration;

  constructor(config: ExtensionConfiguration, browser: Browser) {
    super();
    this.config = config;
    this._panel = null;
    this.browserPage = null;
    this.browser = browser;
    this.contentProvider = new ContentProvider(this.config);
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

    this._panel = vscode.window.createWebviewPanel(BrowserViewWindow.viewType, 'Browser Preview', column, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.config.extensionPath, 'build'))]
    });

    this._panel.webview.html = this.contentProvider.getContent();
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

        if (msg.type === 'extension.openFile') {
          let uri = vscode.Uri.file(msg.params.uri);
          let lineNumber = msg.params.lineNumber;

          // Open document
          vscode.workspace.openTextDocument(uri).then(
            (document: vscode.TextDocument) => {
              // Show the document
              vscode.window.showTextDocument(document, vscode.ViewColumn.One).then(
                (document) => {
                  if (lineNumber) {
                    document.revealRange(
                      new vscode.Range(lineNumber, 0, lineNumber, 0),
                      vscode.TextEditorRevealType.InCenter
                    );
                  }
                },
                (reason) => {
                  vscode.window.showErrorMessage(`Failed to show file. ${reason}`);
                }
              );
            },
            (err) => {
              vscode.window.showErrorMessage(`Failed to open file. ${err}`);
            }
          );
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
            vscode.window.showInputBox({ placeHolder: message }).then((result) => {
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
}
