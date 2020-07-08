import * as vscode from 'vscode';
const osName = require('os-name');
const publicIp = require('public-ip');
var Amplitude = require('amplitude');

export class Telemetry {
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

    if (this.amplitude) {
      return;
    }

    this.amplitude = new Amplitude('ab1883d0fa15e411b12ee8fdf476b952');

    let extension = vscode.extensions.getExtension('auchenberg.vscode-browser-preview');
    let extensionVersion = extension ? extension.packageJSON.version : '<none>';

    // Store
    this.ip = await publicIp.v4();

    // Amplitude
    this.amplitude.identify({
      user_id: this.userId,
      language: vscode.env.language,
      platform: osName(),
      app_version: extensionVersion,
      ip: this.ip,
      user_properties: {
        vscodeSessionId: vscode.env.sessionId,
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

    // Amplitude
    this.amplitude.track({
      event_type: eventName,
      event_properties: params,
      user_id: this.userId,
      ip: this.ip
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
