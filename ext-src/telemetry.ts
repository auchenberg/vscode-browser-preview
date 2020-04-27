var Mixpanel = require('mixpanel');
import * as vscode from 'vscode';
const osName = require('os-name');
const publicIp = require('public-ip');
var Amplitude = require('amplitude');

export class Telemetry {
  client: any;
  amplitude: any;
  userId: string;
  ip: string;
  isTelemetryEnabled: boolean;

  constructor() {
    this.userId = vscode.env.machineId;
    this.isTelemetryEnabled = false;
    this.ip = '';

    this.getSettingFromConfig();
    this.setup();
    vscode.workspace.onDidChangeConfiguration(this.configurationChanged, this);
  }

  async setup() {
    if (!this.isTelemetryEnabled) {
      return;
    }

    if (this.client) {
      return;
    }

    this.client = Mixpanel.init('d0149f7b700b44a18fa53e2cab03b564');
    this.amplitude = new Amplitude('ab1883d0fa15e411b12ee8fdf476b952');

    let extension = vscode.extensions.getExtension('auchenberg.vscode-browser-preview');
    let extensionVersion = extension ? extension.packageJSON.version : '<none>';

    // Store
    this.ip = await publicIp.v4();

    // Mixpanel
    this.client.people.set(this.userId, {
      sessionId: vscode.env.sessionId,
      language: vscode.env.language,
      vscodeVersion: vscode.version,
      platform: osName(),
      version: extensionVersion,
      ip: this.ip
    });

    // Amplitude
    this.amplitude.identify({
      user_id: this.userId,
      language: vscode.env.language,
      platform: osName(),
      app_version: extensionVersion,
      ip_address: this.ip,
      user_properties: {
        sessionId: vscode.env.sessionId,
        vscodeVersion: vscode.version
      }
    });
  }

  sendEvent(eventName: string, params?: any) {
    if (!this.isTelemetryEnabled) {
      return;
    }

    let data = {
      ...params,
      distinct_id: this.userId,
      ip: this.ip
    };

    // Mixpanel
    this.client.track(eventName, data);

    // Amplitude
    this.amplitude.track({
      event_type: eventName,
      event_properties: params,
      user_id: this.userId,
      ip_address: this.ip
    });
  }

  configurationChanged(e: vscode.ConfigurationChangeEvent) {
    vscode.window.showInformationMessage('Updated');
    this.getSettingFromConfig();
  }

  private getSettingFromConfig() {
    let config = vscode.workspace.getConfiguration('telemetry');
    if (config) {
      let enableTelemetry = config.get<boolean>('enableTelemetry');
      this.isTelemetryEnabled = !!enableTelemetry;
    }
    if (this.isTelemetryEnabled) {
      this.setup();
    }
  }
}
