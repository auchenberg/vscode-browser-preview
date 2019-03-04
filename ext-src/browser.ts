'use strict';

import { EventEmitter } from 'events';
import BrowserPage from './browserPage';
import * as whichChrome from 'which-chrome';
import * as vscode from 'vscode';
import * as os from 'os';
import { ExtensionConfiguration } from './extensionConfiguration';

const puppeteer = require('puppeteer-core');
const getPort = require('get-port');

export default class Browser extends EventEmitter {
  private browser: any;
  public remoteDebugPort: number = 0;

  constructor(private config: ExtensionConfiguration) {
    super();
  }

  private async launchBrowser() {
    let chromePath = whichChrome.Chrome || whichChrome.Chromium;
    let chromeArgs = [];
    let platform = os.platform();

    if (this.config.chromeExecutable) {
      chromePath = this.config.chromeExecutable;
    }

    // Detect remote debugging port
    this.remoteDebugPort = await getPort({ port: 9222, host: '127.0.0.1' });
    chromeArgs.push(`--remote-debugging-port=${this.remoteDebugPort}`);

    if (!chromePath) {
      throw new Error(
        `No Chrome installation found, or no Chrome executable set in the settings - used path ${chromePath}`
      );
    }

    if (platform === 'linux') {
      chromeArgs.push('--no-sandbox');
    }

    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      args: chromeArgs
    });
  }

  public async newPage(): Promise<BrowserPage> {
    if (!this.browser) {
      await this.launchBrowser();
    }

    var page = new BrowserPage(this.browser);
    await page.launch();
    return page;
  }

  public dispose(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.browser) {
        this.browser.close();
        this.browser = null;
      }
      resolve();
    });
  }
}
