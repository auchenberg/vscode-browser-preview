import * as React from 'react';
import './App.css';

import Toolbar from './components/toolbar/toolbar';
import ViewportInfo from './components/viewport-info/viewport-info';
import Viewport from './components/viewport/viewport';

interface IState {
  frame: object | null,
  url: string,
  viewportMetadata: {
    height: number,
    width: number,
    loadingPercent: number
  }
}

class App extends React.Component<any, IState> {

  private vscode: any;
  // private finishedRequestsCount = 0;
  // private startedRequestsCount = 0;
  // private pageRequests = {};

  constructor(props: any){
    super(props);
    this.state = { 
      frame: null,
      url: 'http://code.visualstudio.com',
      viewportMetadata: {
        height: 0,
        loadingPercent: 0.0,
        width: 0,
      }
    };

    this.onToolbarActionInvoked = this.onToolbarActionInvoked.bind(this)
    this.onViewportChanged = this.onViewportChanged.bind(this)
    
    this.dispatch('Page.enable');
    // this.dispatch('Network.enable');

    this.dispatch('Page.navigate', {
      url: this.state.url
    });

    window.addEventListener('message', event => {
      switch (event.data.type) {

        // case 'Network.requestWillBeSent':
        //   let request = (event.data.params);
        //   let requestId = event.data.params.requestId;

        //   if (request.type === 'WebSocket') {
        //     return;
        //   }

        //   this.pageRequests[requestId] = request;
        //   ++this.startedRequestsCount;
        //   break;

        // case 'Network.loadingFinished':
        //   if (!(event.data.params.requestId in this.pageRequests)) {
        //     return;
        //   }
        //   ++this.finishedRequestsCount;
          
        //   // Finished requests drive the progress up to 90%.
        //   setTimeout(() => {
        //     this.setState({
        //       viewportMetadata: {
        //         ...this.state.viewportMetadata,
        //         loadingPercent: Math.min(this.finishedRequestsCount / this.startedRequestsCount * 0.9, 1.0),
        //       }            
        //     })            
        //   }, 500); // Delay to give the new requests time to start. This makes the progress smoother.
        //   break;

        case 'Page.frameNavigated':
          const { frame} = event.data.params;

          if(!frame.parentFrameId) { // Is mainframe

            // this.pageRequests = [];
            // this.startedRequestsCount = 0;
            // this.finishedRequestsCount = 0;

            this.setState({
              viewportMetadata: {
                ...this.state.viewportMetadata,
                loadingPercent: 0.1,
              }
            })
          }
          break;

        case 'Page.loadEventFired':

          this.setState({
            viewportMetadata: {
              ...this.state.viewportMetadata,
              loadingPercent: 1.0,
            }            
          })

          setTimeout(() => {
              this.setState({
                viewportMetadata: {
                  ...this.state.viewportMetadata,
                  loadingPercent: 0,
                }            
              })           
          }, 500);
          
          break;

        case 'Page.screencastFrame': 
          const {sessionId, data, metadata} = event.data.params;
          this.dispatch('Page.screencastFrameAck', {sessionId});
          this.setState({
            frame: {
              base64Data: data,
              metadata: metadata
            }
          })
        break;
      }
    }, false);

  }

  public render() {
    const showLoading = this.state.viewportMetadata.loadingPercent > 0 ? true : false;

    return (
      <div className="App">
        <Toolbar url={this.state.url} onActionInvoked={this.onToolbarActionInvoked} />
        <Viewport 
          showLoading={showLoading} 
          width={this.state.viewportMetadata.width} 
          height={this.state.viewportMetadata.height} 
          loadingPercent={this.state.viewportMetadata.loadingPercent} 
          frame={this.state.frame}
          onViewportChanged={this.onViewportChanged} 
        />
        <ViewportInfo height={this.state.viewportMetadata.height} width={this.state.viewportMetadata.width} />
      </div>
    );
  }

  public stopCasting() {
    this.dispatch('Page.stopScreencast');
  }

  public startCasting() {
    this.dispatch('Page.startScreencast', {
      format: 'jpeg',
      maxWidth: this.state.viewportMetadata.width * window.devicePixelRatio,
      maxHeight: this.state.viewportMetadata.height * window.devicePixelRatio,
    });
  }

  private onViewportChanged(action: string, data: any) {

    switch(action) {

      case 'interaction':
        this.dispatch(data.action, data.params)  
        break;

      case 'size':
        this.stopCasting();      

        this.dispatch('Page.setDeviceMetricsOverride', {
          deviceScaleFactor: 2,
          height: data.height,
          mobile: false,
          width: data.width,
        })  

        this.setState({
          viewportMetadata: {
            ...this.state.viewportMetadata,
            height: data.height as number,
            width: data.width as number,
          }
        });
    
        this.startCasting();
        break;
    }
  }

  private onToolbarActionInvoked(action: string, data: any) {
    switch(action) {
      case 'forward':
        this.dispatch('Page.goForward')
        break;
      case 'backward':
        this.dispatch('Page.goBackward')
        break;
      case 'refresh':
        this.dispatch('Page.reload')      
        break;
      case 'urlChange':
        this.dispatch('Page.navigate', {
          url: data.url
        })     

        this.setState({
          url: data.url
        })
        break;   
    }
  
  }

  private dispatch(eventName: string, params?: object) {

    console.log(eventName, params)

    if(!this.vscode){
      try {
        // @ts-ignore 
        this.vscode = acquireVsCodeApi();
      } catch {
        this.vscode = null;
      }
    }

    if(this.vscode) {
      this.vscode.postMessage({
        params,
        type: eventName
      })
    }
  }  
}

export default App;
