import * as React from 'react';
import './App.css';

import Toolbar from './components/toolbar/toolbar';
import Viewport from './components/viewport/viewport';
import Connection from './connection';
import { ExtensionConfiguration } from '../ext-src/extensionConfiguration';

interface IState {
  format: 'jpeg' | 'png';
  frame: object | null;
  url: string;
  isVerboseMode: boolean;
  isInspectEnabled: boolean;
  isDeviceEmulationEnabled: boolean;
  viewportMetadata: IViewport;
  history: {
    canGoBack: boolean;
    canGoForward: boolean;
  };
}

interface IViewport {
  height: number | null;
  width: number | null;
  emulatedDeviceId: string | null;
  isLoading: boolean;
  isFixedSize: boolean;
  isFixedZoom: boolean;
  isResizable: boolean;
  loadingPercent: number;
  highlightInfo: object | null;
  deviceSizeRatio: number;
  screenZoom: number;
  scrollOffsetX: number;
  scrollOffsetY: number;
}

class App extends React.Component<any, IState> {
  private connection: Connection;
  private viewport: any;

  constructor(props: any) {
    super(props);
    this.state = {
      frame: null,
      format: 'jpeg',
      url: 'about:blank',
      isVerboseMode: false,
      isInspectEnabled: false,
      isDeviceEmulationEnabled: false,
      history: {
        canGoBack: false,
        canGoForward: false
      },
      viewportMetadata: {
        deviceSizeRatio: 1,
        height: null,
        width: null,
        highlightInfo: null,
        emulatedDeviceId: 'Responsive',
        isLoading: false,
        isFixedSize: false,
        isFixedZoom: false,
        isResizable: true,
        loadingPercent: 0.0,
        screenZoom: 1,
        scrollOffsetX: 0,
        scrollOffsetY: 0
      }
    };

    this.connection = new Connection();
    this.onToolbarActionInvoked = this.onToolbarActionInvoked.bind(this);
    this.onViewportChanged = this.onViewportChanged.bind(this);

    this.connection.enableVerboseLogging(this.state.isVerboseMode);

    this.connection.on('Page.navigatedWithinDocument', (result: any) => {
      this.requestNavigationHistory();
    });

    this.connection.on('Page.frameNavigated', (result: any) => {
      const { frame } = result;
      var isMainFrame = !frame.parentId;

      if (isMainFrame) {
        this.requestNavigationHistory();
        this.updateState({
          ...this.state,
          viewportMetadata: {
            ...this.state.viewportMetadata,
            isLoading: true,
            loadingPercent: 0.1
          }
        });
      }
    });

    this.connection.on('Page.loadEventFired', (result: any) => {
      this.updateState({
        ...this.state,
        viewportMetadata: {
          ...this.state.viewportMetadata,
          loadingPercent: 1.0
        }
      });

      setTimeout(() => {
        this.updateState({
          ...this.state,
          viewportMetadata: {
            ...this.state.viewportMetadata,
            isLoading: false,
            loadingPercent: 0
          }
        });
      }, 500);
    });

    this.connection.on('Page.screencastFrame', (result: any) => {
      const { sessionId, data, metadata } = result;
      this.connection.send('Page.screencastFrameAck', { sessionId });
      this.updateState({
        ...this.state,
        frame: {
          base64Data: data,
          metadata: metadata
        },
        viewportMetadata: {
          ...this.state.viewportMetadata,
          scrollOffsetX: metadata.scrollOffsetX,
          scrollOffsetY: metadata.scrollOffsetY
        }
      });
    });

    this.connection.on('Page.windowOpen', (result: any) => {
      this.connection.send('extension.windowOpenRequested', {
        url: result.url
      });
    });

    this.connection.on('Page.javascriptDialogOpening', (result: any) => {
      const { url, message, type } = result;

      this.connection.send('extension.windowDialogRequested', {
        url: url,
        message: message,
        type: type
      });
    });

    this.connection.on('Page.frameResized', (result: any) => {
      this.stopCasting();
      this.startCasting();
    });

    this.connection.on('extension.appConfiguration', (payload: ExtensionConfiguration) => {
      if (!payload) {
        return;
      }

      this.updateState({
        isVerboseMode: payload.isVerboseMode ? payload.isVerboseMode : false,
        url: payload.startUrl ? payload.startUrl : 'about:blank',
        format: payload.format ? payload.format : 'jpeg'
      });

      if (payload.startUrl) {
        this.connection.send('Page.navigate', {
          url: payload.startUrl
        });
      }
    });

    this.connection.on('extension.viewport', (viewport: IViewport) => {
      this.handleViewportSizeChange(viewport);
      this.enableViewportDeviceEmulation('Live Share');

      // TODO: Scroll the page
    });

    // Initialize
    this.connection.send('Page.enable');
    // this.connection.send('DOM.enable');
    // this.connection.send('CSS.enable');

    this.requestNavigationHistory();
    this.startCasting();
  }

  public componentDidUpdate() {
    const { isVerboseMode } = this.state;

    this.connection.enableVerboseLogging(isVerboseMode);
  }

  private sendStatetoHost() {
    this.connection.send('extension.appStateChanged', {
      state: this.state
    });
  }

  public render() {
    return (
      <div className="App">
        <Toolbar
          url={this.state.url}
          viewport={this.state.viewportMetadata}
          onActionInvoked={this.onToolbarActionInvoked}
          canGoBack={this.state.history.canGoBack}
          canGoForward={this.state.history.canGoForward}
          isInspectEnabled={this.state.isInspectEnabled}
          isDeviceEmulationEnabled={this.state.isDeviceEmulationEnabled}
        />
        <Viewport
          viewport={this.state.viewportMetadata}
          isInspectEnabled={this.state.isInspectEnabled}
          isDeviceEmulationEnabled={this.state.isDeviceEmulationEnabled}
          frame={this.state.frame}
          format={this.state.format}
          url={this.state.url}
          onViewportChanged={this.onViewportChanged}
          ref={(c) => {
            this.viewport = c;
          }}
        />
      </div>
    );
  }

  public stopCasting() {
    this.connection.send('Page.stopScreencast');
  }

  public startCasting() {
    var params = {
      quality: 80,
      format: this.state.format,
      maxWidth: 2000,
      maxHeight: 2000
    };

    if (this.state.viewportMetadata.width) {
      params.maxWidth = Math.floor(this.state.viewportMetadata.width * window.devicePixelRatio);
    }

    if (this.state.viewportMetadata.height) {
      params.maxHeight = Math.floor(this.state.viewportMetadata.height * window.devicePixelRatio);
    }

    this.connection.send('Page.startScreencast', params);
  }

  private async requestNavigationHistory() {
    const history: any = await this.connection.send('Page.getNavigationHistory');

    if (!history) {
      return;
    }

    let historyIndex = history.currentIndex;
    let historyEntries = history.entries;
    let currentEntry = historyEntries[historyIndex];
    let url = currentEntry.url;

    const pattern = /^http:\/\/(.+)/;
    const match = url.match(pattern);
    if (match) {
      url = match[1];
    }

    this.updateState({
      ...this.state,
      url: url,
      history: {
        canGoBack: historyIndex === 0,
        canGoForward: historyIndex === historyEntries.length - 1
      }
    });

    let panelTitle = currentEntry.title || currentEntry.url;

    this.connection.send('extension.updateTitle', {
      title: `Browser Preview (${panelTitle})`
    });
  }

  private async onViewportChanged(action: string, data: any) {
    switch (action) {
      case 'inspectHighlightRequested':
        let highlightNodeInfo: any = await this.connection.send('DOM.getNodeForLocation', {
          x: data.params.position.x,
          y: data.params.position.y
        });

        if (highlightNodeInfo) {
          // let highlightBoxModel: any = await this.connection.send('DOM.getBoxModel', {
          //   backendNodeId: highlightNodeInfo.backendNodeId
          // });

          let nodeIdsReq: any = await this.connection.send('DOM.pushNodesByBackendIdsToFrontend', {
            backendNodeIds: [highlightNodeInfo.backendNodeId]
          });

          let nodeId = nodeIdsReq.nodeIds[0];
          let computedStyleReq: any = await this.connection.send('CSS.getComputedStyleForNode', {
            nodeId: nodeId
          });

          let cursorCSS = computedStyleReq.computedStyle.find((c: any) => c.name == 'cursor');

          if (cursorCSS) {
            console.log('cursorCSS', cursorCSS.value);
          }

          // if (highlightBoxModel && highlightBoxModel.model) {
          //   this.setState({
          //     ...this.state,
          //     viewportMetadata: {
          //       ...this.state.viewportMetadata,
          //       highlightInfo: highlightBoxModel.model
          //     }
          //   });
          // }
        }
        break;
      case 'inspectElement':
        await this.handleInspectElementRequest(data);
        break;
      case 'interaction':
        this.connection.send(data.action, data.params);
        break;

      case 'size':
        console.log('app.onViewportChanged.size', data);
        let newViewport = {} as any;
        if (data.height !== undefined && data.width !== undefined) {
          let height = Math.floor(data.height);
          let width = Math.floor(data.width);

          let devicePixelRatio = window.devicePixelRatio || 1;

          this.connection.send('Page.setDeviceMetricsOverride', {
            deviceScaleFactor: devicePixelRatio,
            mobile: false,
            height: height,
            width: width
          });

          newViewport.height = height as number;
          newViewport.width = width as number;
        }

        if (data.isResizable !== undefined) {
          newViewport.isResizable = data.isResizable;
        }

        if (data.isFixedSize !== undefined) {
          newViewport.isFixedSize = data.isFixedSize;
        }

        if (data.isFixedZoom !== undefined) {
          newViewport.isFixedZoom = data.isFixedZoom;
        }

        if (data.emulatedDeviceId !== undefined) {
          newViewport.emulatedDeviceId = data.emulatedDeviceId;
        }

        if (data.screenZoom !== undefined) {
          newViewport.screenZoom = data.screenZoom;
        }

        await this.updateState({
          ...this.state,
          viewportMetadata: {
            ...this.state.viewportMetadata,
            ...newViewport
          }
        });
        this.viewport.calculateViewport();

        break;
    }
  }

  private async updateState(newState: any) {
    return new Promise((resolve, reject) => {
      this.setState(newState, () => {
        this.sendStatetoHost();
        resolve();
      });
    });
  }

  private async handleInspectElementRequest(data: any) {
    const nodeInfo: any = await this.connection.send('DOM.getNodeForLocation', {
      x: data.params.position.x,
      y: data.params.position.y
    });
    const nodeDetails: any = await this.connection.send('DOM.resolveNode', {
      nodeId: nodeInfo.nodeId,
      backendNodeId: nodeInfo.backendNodeId
    });
    // Trigger CDP request to enable DOM explorer
    // TODO: No sure this works.
    this.connection.send('Overlay.inspectNodeRequested', {
      backendNodeId: nodeInfo.backendNodeId
    });
    if (nodeDetails.object) {
      let objectId = nodeDetails.object.objectId;
      const nodeProperties: any = await this.connection.send('Runtime.getProperties', {
        objectId: objectId,
        generatePreview: true
      });
      var props = nodeProperties.result as Array<object>;
      var reactInternalRef: any = props.find((i: any) => i.name.startsWith('__reactInternalInstance'));
      if (reactInternalRef) {
        let reactInternalObjectId = reactInternalRef.value.objectId;
        const reactInternalObject: any = await this.connection.send('Runtime.getProperties', {
          objectId: reactInternalObjectId,
          generatePreview: true
        });
        if (reactInternalObject) {
          var reactObjectValues = reactInternalObject.result as Array<object>;
          var reactDebugSourceRef: any = reactObjectValues.find((i: any) => i.name == '_debugSource');
          let reactDebugSourceObjectId = reactDebugSourceRef.value.objectId;
          if (reactDebugSourceObjectId) {
            const reactDebugSourceRef: any = await this.connection.send('Runtime.getProperties', {
              objectId: reactDebugSourceObjectId,
              generatePreview: true
            });
            if (reactDebugSourceRef) {
              var reactDebugSourceProps = reactDebugSourceRef.result as Array<object>;
              var fileNameRef: any = reactDebugSourceProps.find((i: any) => i.name == 'fileName');
              var lineNumberRef: any = reactDebugSourceProps.find((i: any) => i.name == 'lineNumber');
              var fileNameValue = fileNameRef.value.value;
              var lineNumberValue = lineNumberRef.value.value;
              this.connection.send('extension.openFile', {
                uri: fileNameValue,
                lineNumber: lineNumberValue
              });
            }
          }
        }
      }
    }
  }

  private onToolbarActionInvoked(action: string, data: any): Promise<any> {
    switch (action) {
      case 'forward':
        this.connection.send('Page.goForward');
        break;
      case 'backward':
        this.connection.send('Page.goBackward');
        break;
      case 'refresh':
        this.connection.send('Page.reload');
        break;
      case 'inspect':
        this.handleToggleInspect();
        break;
      case 'emulateDevice':
        this.handleToggleDeviceEmulation();
        break;
      case 'urlChange':
        this.handleUrlChange(data);
        break;
      case 'readClipboard':
        return this.connection.send('Clipboard.readText');
      case 'writeClipboard':
        this.handleClipboardWrite(data);
        break;
      case 'viewportSizeChange':
        this.handleViewportSizeChange(data);
        break;
      case 'viewportDeviceChange':
        this.handleViewportDeviceChange(data);
        break;
    }
    // return an empty promise
    return Promise.resolve();
  }

  private handleToggleInspect() {
    if (this.state.isInspectEnabled) {
      this.updateState({
        isInspectEnabled: false,
        viewportMetadata: {
          ...this.state.viewportMetadata,
          highlightInfo: null
        }
      });
    } else {
      this.updateState({
        isInspectEnabled: true
      });
    }
  }

  private handleUrlChange(data: any) {
    this.connection.send('Page.navigate', {
      url: data.url
    });
    this.updateState({
      ...this.state,
      url: data.url
    });
  }

  private handleViewportSizeChange(data: any) {
    this.onViewportChanged('size', {
      width: data.width,
      height: data.height
    });
  }

  private handleViewportDeviceChange(data: any) {
    let isResizable = data.device.name === 'Responsive';
    let isFixedSize = data.device.name !== 'Responsive';
    let isFixedZoom = data.device.name === 'Responsive';
    let width = data.device.viewport ? data.device.viewport.width : undefined;
    let height = data.device.viewport ? data.device.viewport.height : undefined;
    let screenZoom = 1;

    this.onViewportChanged('size', {
      emulatedDeviceId: data.device.name,
      height: height,
      isResizable: isResizable,
      isFixedSize: isFixedSize,
      isFixedZoom: isFixedZoom,
      screenZoom: screenZoom,
      width: width
    });
  }

  private handleToggleDeviceEmulation() {
    if (this.state.isDeviceEmulationEnabled) {
      this.disableViewportDeviceEmulation();
    } else {
      this.enableViewportDeviceEmulation();
    }
  }

  private disableViewportDeviceEmulation() {
    console.log('app.disableViewportDeviceEmulation');
    this.handleViewportDeviceChange({
      device: {
        name: 'Responsive',
        viewport: {
          width: this.state.viewportMetadata.width,
          height: this.state.viewportMetadata.height
        }
      }
    });
    this.updateState({
      isDeviceEmulationEnabled: false
    });
  }

  private enableViewportDeviceEmulation(deviceName: string = 'Responsive') {
    console.log('app.enableViewportDeviceEmulation');
    this.handleViewportDeviceChange({
      device: {
        name: deviceName,
        viewport: {
          width: this.state.viewportMetadata.width,
          height: this.state.viewportMetadata.height
        }
      }
    });
    this.updateState({
      isDeviceEmulationEnabled: true
    });
  }

  private handleClipboardWrite(data: any) {
    // overwrite the clipboard only if there is a valid value
    if (data && (data as any).value) {
      return this.connection.send('Clipboard.writeText', data);
    }
  }
}

export default App;
