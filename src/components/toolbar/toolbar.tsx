import * as React from 'react';
import './toolbar.css';

import UrlInput from '../url-input/url-input';
import DeviceSettings from '../device-settings/device-settings';

const iconBackwardStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNDI3IDIzNC42MjVIMTY3LjI5NmwxMTkuNzAyLTExOS43MDJMMjU2IDg1IDg1IDI1NmwxNzEgMTcxIDI5LjkyMi0yOS45MjQtMTE4LjYyNi0xMTkuNzAxSDQyN3YtNDIuNzV6Ii8+PC9zdmc+)`
};

const iconForwardStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNODUgMjc3LjM3NWgyNTkuNzA0TDIyNS4wMDIgMzk3LjA3NyAyNTYgNDI3bDE3MS0xNzFMMjU2IDg1bC0yOS45MjIgMjkuOTI0IDExOC42MjYgMTE5LjcwMUg4NXY0Mi43NXoiLz48L3N2Zz4=)`
};

const iconRefreshStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDM4OGMtNzIuNTk3IDAtMTMyLTU5LjQwNS0xMzItMTMyIDAtNzIuNjAxIDU5LjQwMy0xMzIgMTMyLTEzMiAzNi4zIDAgNjkuMjk5IDE1LjQgOTIuNDA2IDM5LjYwMUwyNzggMjM0aDE1NFY4MGwtNTEuNjk4IDUxLjcwMkMzNDguNDA2IDk5Ljc5OCAzMDQuNDA2IDgwIDI1NiA4MGMtOTYuNzk3IDAtMTc2IDc5LjIwMy0xNzYgMTc2czc4LjA5NCAxNzYgMTc2IDE3NmM4MS4wNDUgMCAxNDguMjg3LTU0LjEzNCAxNjkuNDAxLTEyOEgzNzguODVjLTE4Ljc0NSA0OS41NjEtNjcuMTM4IDg0LTEyMi44NSA4NHoiLz48L3N2Zz4=)`
};

const iconInspectStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIxNjBweCIgaGVpZ2h0PSIxNjBweCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+ICAgICAgICA8dGl0bGU+aW5zcGVjdDwvdGl0bGU+ICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4gICAgICAgIDxnIGlkPSJpbnNwZWN0IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjQuMDAwMDAwLCAtMjQuMDAwMDAwKSI+ICAgICAgICAgICAgPHBvbHlnb24gaWQ9InBhdGgzNDYiIG9wYWNpdHk9IjAuNSIgcG9pbnRzPSIwIDAgMTk2IDAgMTk2IDE5NiAwIDE5NiI+PC9wb2x5Z29uPiAgICAgICAgICAgIDxwYXRoIGQ9Ik03My41LDE3MS41IEw0Mi44NzUsMTcxLjUgQzMwLjYyNSwxNzEuNSAyNC41LDE2NS4zNzUgMjQuNSwxNTMuMTI1IEwyNC41LDQyLjg3NSBDMjQuNSwzMC42MjUgMzAuNjI1LDI0LjUgNDIuODc1LDI0LjUgTDE1My4xMjUsMjQuNSBDMTcxLjUsMjQuNSAxNzEuNSw0Mi40ODA1NSAxNzEuNSw0Mi44NzUgTDE3MS41LDczLjUgTDE1OS4yNSw3My41IEwxNTkuMjUsMzYuNzUgTDM2Ljc1LDM2Ljc1IEwzNi43NSwxNTkuMjUgTDczLjUsMTU5LjI1IEw3My41LDE3MS41IFogTTE4My43NSwxMTAuMjUgTDE0NywxMzQuNzUgTDE4My43NSwxNzEuNSBMMTcxLjUsMTgzLjc1IEwxMzQuNzUsMTQ3IEwxMTAuMjUsMTgzLjc1IEw4NS43NSw4NS43NSBMMTgzLjc1LDExMC4yNSBaIiBpZD0icGF0aDM0OCIgZmlsbD0iIzAwMDAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48L3BhdGg+ICAgICAgICA8L2c+ICAgIDwvZz48L3N2Zz4=)`,
  backgroundSize: `12px 12px`
};

const iconDeviceStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTYiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUyLjIgKDY3MTQ1KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5waG9uZTwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJwaG9uZSIgZmlsbD0iIzAwMDAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPHBhdGggZD0iTTMsMSBMMyw1LjAwMDEgTDMsNi4wMDAyIEw2LjM0MzQsNi41MzEzNSBMNi4zMjc4LDE0LjU3ODE1IEw1LDE0Ljk5OTk4IEM1LjAwNiwxNS41OTI3NiA1LjQzOTMxLDE2LjAxMTM4IDYsMTUuOTk5OTggTDE0LDE1Ljk5OTk4IEMxNC41Nzg5NiwxNi4wMDE5OCAxNC45ODE3NywxNS41NzI5IDE1LDE0Ljk5OTk4IEwxNSwwLjk5OTk4IEMxNC45ODk4LDAuNDY1MjEgMTQuNTE4MjMsMC4wMDI1OSAxNCwtMmUtMDUgTDQsLTJlLTA1IEMzLjQ2NzAzLDAuMDA3OTggMy4wMDI4NCwwLjQ1Njc1IDMsMC45OTk5OCBMMywxIFogTTMuOTk5OTUsMSBMMTQsMSBMMTQsMTUgTDYsMTUgTDYuNzE4NDUsMTQuNTc4MjEgTDYuODEyMTUsNi4xNTY0MSBMMy45OTk5NSw2LjAwMDMxIEwzLjk5OTk1LDUuMDAwMzggTDMuOTk5OTUsMSBaIiBpZD0icGF0aDM4MiIvPgogICAgICAgICAgICA8cGF0aCBkPSJNMCw2IEwwLDE1IEMwLjAwNiwxNS41OTI3OCAwLjQzOTMxLDE2LjAxMTQgMSwxNiBMNiwxNiBDNi41Nzg5NiwxNi4wMDIgNi45ODE3NywxNS41NzI5MiA3LDE1IEw3LDYgQzYuOTg5OCw1LjQ2NTIzIDYuNTE4MjMsNS4wMDI2MSA2LDUgTDEsNSBDMC40NjcwMyw1LjAwOCAwLjAwMjg0LDUuNDU2NzcgMCw2IFogTTEsNy4wMDAyIEw2LDcuMDAwMiBMNiwxNC4wMDAyIEwxLDE0LjAwMDIgTDEsNy4wMDAyIFoiIGlkPSJwYXRoMzg0Ii8+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=)`,
  backgroundSize: `14px 14px`
};

interface IToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isInspectEnabled: boolean;
  isDeviceEmulationEnabled: boolean;
  url: string;
  viewport: any;
  onActionInvoked: (action: string, data?: object) => Promise<any>;
}

class Toolbar extends React.Component<IToolbarProps, any> {
  private viewportMetadata: any;

  constructor(props: any) {
    super(props);

    this.handleBack = this.handleBack.bind(this);
    this.handleForward = this.handleForward.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleInspect = this.handleInspect.bind(this);
    this.handleEmulateDevice = this.handleEmulateDevice.bind(this);
    this.handleDeviceChange = this.handleDeviceChange.bind(this);
    this.handleViewportSizeChange = this.handleViewportSizeChange.bind(this);
  }

  public render() {
    this.viewportMetadata = this.props.viewport;

    return (
      <div className="toolbar">
        <div className="inner">
          <button
            className={`inspect ` + (this.props.isInspectEnabled ? `active` : ``)}
            style={iconInspectStyle}
            onClick={this.handleInspect}
          >
            Inspect
          </button>
          <button
            className={`device ` + (this.props.isDeviceEmulationEnabled ? `active` : ``)}
            style={iconDeviceStyle}
            onClick={this.handleEmulateDevice}
          >
            Emulate device
          </button>
          <button
            className="backward"
            style={iconBackwardStyle}
            onClick={this.handleBack}
            disabled={this.props.canGoBack}
          >
            Backward
          </button>
          <button
            className="forward"
            style={iconForwardStyle}
            onClick={this.handleForward}
            disabled={this.props.canGoForward}
          >
            Forward
          </button>
          <button className="refresh" style={iconRefreshStyle} onClick={this.handleRefresh}>
            Refresh
          </button>
          <UrlInput
            url={this.props.url}
            onUrlChanged={this.handleUrlChange}
            onActionInvoked={this.props.onActionInvoked}
          />
        </div>
        <DeviceSettings
          viewportMetadata={this.viewportMetadata}
          isVisible={this.props.isDeviceEmulationEnabled}
          onDeviceChange={this.handleDeviceChange}
          onViewportSizeChange={this.handleViewportSizeChange}
        />
      </div>
    );
  }

  private handleUrlChange(url: string) {
    this.props.onActionInvoked('urlChange', { url });
  }

  private handleBack() {
    this.props.onActionInvoked('backward', {});
  }

  private handleForward() {
    this.props.onActionInvoked('forward', {});
  }

  private handleRefresh() {
    this.props.onActionInvoked('refresh', {});
  }

  private handleInspect() {
    this.props.onActionInvoked('inspect', {});
  }

  private handleEmulateDevice() {
    this.props.onActionInvoked('emulateDevice', {});
  }

  private handleViewportSizeChange(viewportSize: any) {
    this.props.onActionInvoked('viewportSizeChange', {
      height: viewportSize.height,
      width: viewportSize.width
    });
  }

  private handleDeviceChange(device: any) {
    this.props.onActionInvoked('viewportDeviceChange', {
      device: device
    });
  }
}

export default Toolbar;
