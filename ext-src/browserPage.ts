'use strict';

import { EventEmitter } from 'events';
import Clipboard from './clipboard';
var EventEmitterEnhancer = require('event-emitter-enhancer');
var EnhancedEventEmitter = EventEmitterEnhancer.extend(EventEmitter);

export default class BrowserPage extends EnhancedEventEmitter {
  private client: any;
  private browser: any;
  private clipboard: Clipboard;
  public page: any;

  constructor(browser: any) {
    super();
    this.browser = browser;
    this.clipboard = new Clipboard();
  }

  public dispose() {
    this.removeAllElseListeners();
    this.removeAllListeners();
    this.client.detach();
    this.page.close();
  }

  public async send(action: string, data: object, callbackId?: number) {
    console.log('► browserPage.send', action);

    switch (action) {
      case 'Page.goForward':
        await this.page.goForward();
        break;
      case 'Page.goBackward':
        await this.page.goBack();
        break;
      case 'Clipboard.readText':
        this.clipboard.readText().then(
          (result: any) => {
            this.emit({
              callbackId: callbackId,
              result: result
            });
          },
          (err: any) => {
            this.emit({
              callbackId: callbackId,
              error: err.message
            });
          }
        );
        break;
      case 'Clipboard.writeText':
        this.clipboard.writeText((data as any).value).then(
          (result: any) => {
            this.emit({
              callbackId: callbackId,
              result: result
            });
          },
          (err: any) => {
            this.emit({
              callbackId: callbackId,
              error: err.message
            });
          }
        );
        break;
      default:
        this.client
          .send(action, data)
          .then((result: any) => {
            this.emit({
              callbackId: callbackId,
              result: result
            });
          })
          .catch((err: any) => {
            this.emit({
              callbackId: callbackId,
              error: err.message
            });
          });
    }
  }

  public async launch(): Promise<void> {
    this.page = await this.browser.newPage();
    this.client = await this.page.target().createCDPSession();

    EventEmitterEnhancer.modifyInstance(this.client);

    this.client.else((action: string, data: object) => {
      console.log('◀ browserPage.received', action);
      this.emit({
        method: action,
        result: data
      });
    });
  }
}
