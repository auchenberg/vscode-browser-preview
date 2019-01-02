import * as React from 'react';
import './App.css';

import Toolbar from './components/toolbar/toolbar';
import ViewportInfo from './components/viewport-info/viewport-info';
import Viewport from './components/viewport/viewport';

interface IState {
  url: string,
  viewportMetadata: {
    height: number,
    width: number,
    loadingPercent: number
  }
}

class App extends React.Component<any, IState> {

  constructor(props: any){
    super(props);
    this.state = { 
      url: 'http://code.visualstudio.com',
      viewportMetadata: {
        height: 0,
        loadingPercent: 0.8,
        width: 0,
      }
    };

    this.onToolbarActionInvoked = this.onToolbarActionInvoked.bind(this)
    this.onViewportChanged = this.onViewportChanged.bind(this)
  }

  public render() {

    const showLoading = this.state.viewportMetadata.loadingPercent > 0 ? true : false;

    return (
      <div className="App">
        <Toolbar url={this.state.url} onActionInvoked={this.onToolbarActionInvoked} />
        <Viewport showLoading={showLoading} width={this.state.viewportMetadata.width} height={this.state.viewportMetadata.height} loadingPercent={this.state.viewportMetadata.loadingPercent} onViewportChanged={this.onViewportChanged} />
        <ViewportInfo height={this.state.viewportMetadata.height} width={this.state.viewportMetadata.width} />
      </div>
    );
  }

  private onViewportChanged(action: string, data: any) {

    switch(action) {
      case 'size':
        this.setState({
          viewportMetadata: {
            height: data.height as number,
            loadingPercent: this.state.viewportMetadata.loadingPercent,
            width: data.width as number,
          }
        });

        this.dispatch('Page.setViewport', {
          height: data.height,
          width: data.width,
        })  
      break;
    }
  }

  private onToolbarActionInvoked(action: string, data: any) {
    switch(action) {
      case 'forward':
        this.dispatch('Page.goForward')
        break;
      case 'backward':
        this.dispatch('Page.goBack')
        break;
      case 'refresh':
        this.dispatch('Page.reload')
        this.setState({
          viewportMetadata: {
            height: this.state.viewportMetadata.height,
            loadingPercent: 0.1,
            width: this.state.viewportMetadata.width,
          }
        });        
        break;
      case 'urlChanged':
        this.dispatch('Page.navigate', {
          url: data.url
        })     
        break;   
    }
  
  }

  private dispatch(eventName: string, params?: object) {
    let vscode;

    console.log(eventName, params)

    try {
      // @ts-ignore 
      vscode = acquireVsCodeApi();
    } catch {
      vscode = null;
    }

    if(vscode) {
      vscode.postMessage({
        params,
        type: eventName
      })
    }
  }  
}

export default App;
