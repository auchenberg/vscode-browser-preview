import * as React from 'react';
import './viewport.css';

import Loading from '../loading-bar/loading-bar';
import Screencast from '../screencast/screencast';

class Viewport extends React.Component<any, any> {

  private viewportRef: React.RefObject<HTMLDivElement>

  constructor(props: any){
    super(props);
    this.viewportRef = React.createRef();
  }
  
  public componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  public render() {
    return (
      <div className="viewport" ref={this.viewportRef}>
        <Loading percent={this.props.loadingPercent} />      
        <Screencast height={this.props.height} width={this.props.width} />
      </div>
    );
  }

  private updateDimensions() {
    if(this.viewportRef.current) {
      const dim = this.viewportRef.current.getBoundingClientRect();

      this.props.onViewportChanged('size', {
        height: dim.height,
        width: dim.width,
      }) 
    }
  }

}

export default Viewport;
