'use strict';

import { EventEmitter } from 'events';
import BrowserPage from './browserPage';
import * as whichChrome from 'which-chrome';
import * as vscode from 'vscode';
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

    if (this.config.chromeExecutable) {
      chromePath = this.config.chromeExecutable;
    }

    this.remoteDebugPort = await getPort({ port: 9222 });

    if (!chromePath) {
      throw new Error(
        `No Chrome installation found, or no Chrome executable set in the settings - used path ${chromePath}`
      );
    }

    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      args: [`--remote-debugging-port=${this.remoteDebugPort}`]
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
