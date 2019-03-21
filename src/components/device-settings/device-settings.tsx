import * as React from 'react';
import './device-settings.css';

const devices = require('browser-viewport-device-descriptions');

class DeviceSettings extends React.Component<any, any> {
  private emulatedDevices: any[];
  private zoomLevels: any[];

  constructor(props: any) {
    super(props);

    this.handleWidthChange = this.handleWidthChange.bind(this);
    this.handleHeightChange = this.handleHeightChange.bind(this);
    this.handleDeviceChange = this.handleDeviceChange.bind(this);

    this.emulatedDevices = [{ name: 'Responsive', userAgent: '', viewport: [] }]
      .concat(devices)
      .filter((d: any) => !d.viewport.isLandscape);
    this.zoomLevels = [
      { name: 'Fit to Window', value: 'fit' },
      { name: '50%', value: '50%' },
      { name: '75%', value: '75%' },
      { name: '100%', value: '100%' },
      { name: '125%', value: '125%' },
      { name: '150%', value: '150%' }
    ];
  }

  public render() {
    return (
      <div className={`device-settings ` + (this.props.isVisible ? `active` : ``)}>
        <select className="device-selector" onChange={this.handleDeviceChange}>
          {this.emulatedDevices.map((device: any) => {
            return (
              <option key={device.name} value={device.name}>
                {device.name}
              </option>
            );
          })}
        </select>

        <span className="metadata">
          <input
            className="viewport-size-input"
            type="number"
            min="0"
            value={this.props.width}
            onChange={this.handleWidthChange}
          />
          <span className="spacer">𝗑</span>
          <input
            className="viewport-size-input"
            type="number"
            min="0"
            value={this.props.height}
            onChange={this.handleHeightChange}
          />
        </span>

        <select className="zoom-selector">
          {this.zoomLevels.map((level: any) => {
            return (
              <option key={level.name} value={level.value}>
                {level.name}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  private handleDeviceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    let deviceName = e.target.value;
    let device = this.emulatedDevices.find((d: any) => d.name == deviceName);

    this.props.onDeviceChange(device);
  }

  private handleHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    var newVal = parseInt(e.target.value);

    this.props.onViewportSizeChange({
      height: newVal,
      width: this.props.width
    });
  }

  private handleWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    var newVal = parseInt(e.target.value);

    this.props.onViewportSizeChange({
      width: newVal,
      height: this.props.height
    });
  }
}

export default DeviceSettings;
