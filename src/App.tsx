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
  viewportMetadata: {
    height: number;
    width: number;
    isLoading: boolean;
    loadingPercent: number;
  };
  history: {
    canGoBack: boolean;
    canGoForward: boolean;
  };
}

class App extends React.Component<any, IState> {
  private connection: Connection;

  constructor(props: any) {
    super(props);
    this.state = {
      frame: null,
      format: 'jpeg',
      url: 'about:blank',
      isVerboseMode: false,
      history: {
        canGoBack: false,
        canGoForward: false
      },
      viewportMetadata: {
        height: 0,
        isLoading: false,
        loadingPercent: 0.0,
        width: 0
      }
    };

    this.connection = new Connection();
    this.onToolbarActionInvoked = this.onToolbarActionInvoked.bind(this);
    this.onViewportChanged = this.onViewportChanged.bind(this);

    this.connection.enableVerboseLogging(this.state.isVerboseMode);

    this.connection.on('Page.frameNavigated', (result: any) => {
      const { frame } = result;
      var isMainFrame = !frame.parentId;

      if (isMainFrame) {
        this.requestNavigationHistory();
        this.setState({
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
      this.setState({
        ...this.state,
        viewportMetadata: {
          ...this.state.viewportMetadata,
          loadingPercent: 1.0
        }
      });

      setTimeout(() => {
        this.setState({
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
      this.setState({
        ...this.state,
        frame: {
          base64Data: data,
          metadata: metadata
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

    this.connection.on(
      'extension.appConfiguration',
      (payload: ExtensionConfiguration) => {
        if (!payload) {
          return;
        }

        this.setState({
          isVerboseMode: payload.isVerboseMode ? payload.isVerboseMode : false,
          url: payload.startUrl ? payload.startUrl : 'about:blank',
          format: payload.format ? payload.format : 'jpeg'
        });

        if (payload.startUrl) {
          this.connection.send('Page.navigate', {
            url: payload.startUrl
          });
        }
      }
    );

    // Initialize
    this.connection.send('Page.enable');

    this.requestNavigationHistory();
  }

  public componentDidUpdate() {
    const { isVerboseMode } = this.state;

    this.connection.enableVerboseLogging(isVerboseMode);
  }

  public render() {
    return (
      <div className="App">
        <Toolbar
          url={this.state.url}
          onActionInvoked={this.onToolbarActionInvoked}
          canGoBack={this.state.history.canGoBack}
          canGoForward={this.state.history.canGoForward}
        />
        <Viewport
          showLoading={this.state.viewportMetadata.isLoading}
          width={this.state.viewportMetadata.width}
          height={this.state.viewportMetadata.height}
          loadingPercent={this.state.viewportMetadata.loadingPercent}
          frame={this.state.frame}
          onViewportChanged={this.onViewportChanged}
        />
      </div>
    );
  }

  public stopCasting() {
    window.alert('hallo');
    this.connection.send('Page.stopScreencast');
  }

  public startCasting() {
    this.connection.send('Page.startScreencast', {
      quality: 80,
      format: this.state.format,
      maxWidth: Math.floor(
        this.state.viewportMetadata.width * window.devicePixelRatio
      ),
      maxHeight: Math.floor(
        this.state.viewportMetadata.height * window.devicePixelRatio
      )
    });
  }

  private async requestNavigationHistory() {
    const history: any = await this.connection.send(
      'Page.getNavigationHistory'
    );

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

    this.setState({
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

  private onViewportChanged(action: string, data: any) {
    switch (action) {
      case 'interaction':
        this.connection.send(data.action, data.params);
        break;

      case 'size':
        let req = this.connection.send('Page.setDeviceMetricsOverride', {
          deviceScaleFactor: 2,
          height: Math.floor(data.height),
          mobile: false,
          width: Math.floor(data.width)
        });

        req.then(() => {
          this.setState({
            ...this.state,
            viewportMetadata: {
              ...this.state.viewportMetadata,
              height: data.height as number,
              width: data.width as number
            }
          });
        });

        break;
    }
  }

  private onToolbarActionInvoked(action: string, data: any) {
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
      case 'urlChange':
        this.connection.send('Page.navigate', {
          url: data.url
        });
        this.setState({
          ...this.state,
          url: data.url
        });
        break;
    }
  }
}

export default App;
