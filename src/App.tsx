import * as React from 'react';
import './App.css';

import Toolbar from './components/toolbar/toolbar';
import ViewportInfo from './components/viewport-info/viewport-info';
import Viewport from './components/viewport/viewport';

interface IState {
  frames: any[],
  url: string,
  viewportMetadata: {
    height: number,
    width: number,
    loadingPercent: number
  }
}

class App extends React.Component<any, IState> {

  private vscode: any;

  constructor(props: any){
    super(props);
    this.state = { 
      frames: [],
      url: 'http://code.visualstudio.com',
      viewportMetadata: {
        height: 0,
        loadingPercent: 0.8,
        width: 0,
      }
    };

    this.onToolbarActionInvoked = this.onToolbarActionInvoked.bind(this)
    this.onViewportChanged = this.onViewportChanged.bind(this)
    
    
    this.dispatch('Page.navigate', {
      url: this.state.url
    });

    window.addEventListener('message', event => {
      switch (event.data.type) {
        case 'Page.screencastFrame': 
          const {sessionId, data, metadata} = event.data.params;
          this.dispatch('Page.screencastFrameAck', {sessionId});
          this.setState({
            frames: this.state.frames.concat([{
              base64Data: data,
              metadata: metadata
            }])
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
          frames={this.state.frames}
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
        this.setState({
          viewportMetadata: {
            ...this.state.viewportMetadata,
            loadingPercent: 0.1,
          }
        });        
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
