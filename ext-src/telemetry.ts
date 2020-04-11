var Mixpanel = require('mixpanel');
import * as vscode from 'vscode';
import osName = require('os-name');
import readPkgUp = require('read-pkg-up');

export class Telemetry {
  client: any;
  userId: string;

  constructor() {
    this.client = Mixpanel.init('d0149f7b700b44a18fa53e2cab03b564');
    this.userId = vscode.env.machineId;
    this.setup();
  }

  async setup() {
    const packageMetadata = await readPkgUp();

    let extensionVersion = packageMetadata ? packageMetadata.packageJson.version : '<none>';

    this.client.people.set(this.userId, {
      sessionId: vscode.env.sessionId,
      language: vscode.env.language,
      vscodeVersion: vscode.version,
      platform: osName(),
      version: extensionVersion
    });

    this.sendEvent('activate');
  }

  sendEvent(eventName: string, params?: any) {
    let data = {
      ...params,
      distinct_id: this.userId
    };

    this.client.track(eventName, data);
  }
}
