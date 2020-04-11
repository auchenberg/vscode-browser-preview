import * as path from 'path';
import * as vscode from 'vscode';
import * as EventEmitter from 'eventemitter2';

import Browser from './browser';
import { ExtensionConfiguration } from './extensionConfiguration';
import { BrowserViewWindow } from './BrowserViewWindow';
import { Telemetry } from './telemetry';

export class BrowserViewWindowManager extends EventEmitter.EventEmitter2 {
  public openWindows: Set<BrowserViewWindow>;
  private browser: any;
  private defaultConfig: ExtensionConfiguration;
  private telemetry: Telemetry;

  constructor(extensionPath: string, telemetry: Telemetry) {
    super();
    this.openWindows = new Set();
    this.telemetry = telemetry;
    this.defaultConfig = {
      extensionPath: extensionPath,
      startUrl: 'http://code.visualstudio.com',
      format: 'jpeg',
      columnNumber: 2
    };
    this.refreshSettings();

    this.on('windowOpenRequested', (params) => {
      this.create(params.url);
    });
  }

  private refreshSettings() {
    let extensionSettings = vscode.workspace.getConfiguration('browser-preview');
    if (extensionSettings) {
      let chromeExecutable = extensionSettings.get<string>('chromeExecutable');
      if (chromeExecutable !== undefined) {
        this.defaultConfig.chromeExecutable = chromeExecutable;
      }
      let startUrl = extensionSettings.get<string>('startUrl');
      if (startUrl !== undefined) {
        this.defaultConfig.startUrl = startUrl;
      }
      let isVerboseMode = extensionSettings.get<boolean>('verbose');
      if (isVerboseMode !== undefined) {
        this.defaultConfig.isVerboseMode = isVerboseMode;
      }
      let format = extensionSettings.get<string>('format');
      if (format !== undefined) {
        this.defaultConfig.format = format.includes('png') ? 'png' : 'jpeg';
      }
    }
  }

  getLastColumnNumber() {
    let lastWindow = Array.from(this.openWindows).pop();
    if (lastWindow) {
      return lastWindow.config.columnNumber;
    }
    return 1;
  }

  public async create(startUrl?: string, id?: string) {
    this.refreshSettings();
    let config = { ...this.defaultConfig };

    if (!this.browser) {
      this.browser = new Browser(config, this.telemetry);
    }

    let lastColumnNumber = this.getLastColumnNumber();
    if (lastColumnNumber) {
      config.columnNumber = lastColumnNumber + 1;
    }

    let window = new BrowserViewWindow(config, this.browser, id);

    await window.launch(startUrl);
    window.once('disposed', () => {
      let id = window.id;
      this.openWindows.delete(window);
      if (this.openWindows.size === 0) {
        this.browser.dispose();
        this.browser = null;
      }

      this.emit('windowDisposed', id);
    });

    window.on('windowOpenRequested', (params) => {
      this.emit('windowOpenRequested', params);
    });

    this.openWindows.add(window);

    this.emit('windowCreated', window.id);

    return window;
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

  public getByUrl(url: string): BrowserViewWindow | undefined {
    let match = undefined;
    this.openWindows.forEach((b: BrowserViewWindow) => {
      if (b.config.startUrl == url) {
        match = b;
      }
    });
    return match;
  }

  public getById(id: string): BrowserViewWindow | undefined {
    let match = undefined;
    this.openWindows.forEach((b: BrowserViewWindow) => {
      if (b.id == id) {
        match = b;
      }
    });
    return match;
  }
}
