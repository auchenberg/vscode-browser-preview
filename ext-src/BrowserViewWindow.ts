import * as path from 'path';
import * as vscode from 'vscode';
import * as EventEmitter from 'eventemitter2';

import Browser from './browser';
import BrowserPage from './browserPage';
import { ExtensionConfiguration } from './extensionConfiguration';
import ContentProvider from './contentProvider';
const uuidv4 = require('uuid/v4');

export const PANEL_TITLE = 'Browser Preview';

export class BrowserViewWindow extends EventEmitter.EventEmitter2 {
  private static readonly viewType = 'browser-preview';
  private _panel: vscode.WebviewPanel | null;
  private _disposables: vscode.Disposable[] = [];
  private state = {};
  private contentProvider: ContentProvider;
  public browserPage: BrowserPage | null;
  private browser: Browser;
  public id: string;
  public config: ExtensionConfiguration;

  constructor(config: ExtensionConfiguration, browser: Browser) {
    super();
    this.config = config;
    this._panel = null;
    this.browserPage = null;
    this.browser = browser;
    this.contentProvider = new ContentProvider(this.config);
    this.id = uuidv4();
  }

  public async launch(startUrl?: string, title: string = PANEL_TITLE) {
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
    // let columnNumber = <number>this.config.columnNumber;
    // var column = <any>vscode.ViewColumn[columnNumber];
    let showOptions = {
      viewColumn: vscode.ViewColumn.Beside
    };
    this._panel = vscode.window.createWebviewPanel(BrowserViewWindow.viewType, title, showOptions, {
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

        if (msg.type === 'extension.appStateChanged') {
          this.state = msg.params.state;
        }

        if (this.browserPage) {
          try {
            this.browserPage.send(msg.type, msg.params, msg.callbackId);
            this.emit(msg.type, msg.params);
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

  public getState() {
    return this.state;
  }

  public setViewport(viewport: any) {
    this._panel!.webview.postMessage({
      method: 'extension.viewport',
      result: viewport
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
