'use strict';

import { EventEmitter } from 'events';
import BrowserPage from './browserPage'
import * as whichChrome from 'which-chrome';

const puppeteer = require('puppeteer');

export default class Browser extends EventEmitter {
    
    private browser: any;

    constructor() {
        super()
    }

    private async launchBrowser() {
        let chromePath = whichChrome.Chrome

        if(!chromePath) {
            throw new Error(`No Chrome installation found - used path ${chromePath}`)
        }

        this.browser = await puppeteer.launch({
            executablePath: chromePath,
            args: [
                '--remote-debugging-port=9222'
            ]
        })  
    }
    
    public async newPage(): Promise<BrowserPage> {
        if(!this.browser) {
            await this.launchBrowser();               
        }
        
        var page = new BrowserPage(this.browser);
        await page.launch()
        return page;
    }

    public dispose(): Promise<any> {
        return new Promise((resolve, reject) => {
            if(this.browser) {
                this.browser.close();
                this.browser = null;
            }
            resolve();
        })
    }

}

