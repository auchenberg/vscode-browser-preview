'use strict';

import { EventEmitter } from 'events';
var EventEmitterEnhancer = require('event-emitter-enhancer');
var EnhancedEventEmitter = EventEmitterEnhancer.extend(EventEmitter); 

export default class BrowserPage extends EnhancedEventEmitter {

    private client: any;
    private browser: any;
    public page: any;

    constructor(browser: any) {
        super();
        this.browser = browser;
    }

    public async send(action: string, data: object) {
        console.log('-> browserPage.send', action)
        
        switch (action) {
            case 'Page.goForward':
                await this.page.goForward();
                break;
            case 'Page.goBackward':
                await this.page.goBack();
                break;
            default:
                await this.client.send(action, data);
        }
    }

    public async launch(): Promise<void> {
        this.page = await this.browser.newPage();
        this.client = await this.page.target().createCDPSession();

        EventEmitterEnhancer.modifyInstance(this.client);

        this.client.else((action: string, data: object) => {
            console.log('<- browserPage.received', action)
            this.emit(action, data)
        });      
    }

}