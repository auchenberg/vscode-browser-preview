import * as React from 'react';
import './viewport.css';

import Loading from '../loading-bar/loading-bar';
import Screencast from '../screencast/screencast';
import * as _ from "lodash";

class Viewport extends React.Component<any, any> {

  private viewportRef: React.RefObject<HTMLDivElement>
  private debouncedResizeHandler: any;

  constructor(props: any){
    super(props);
    this.viewportRef = React.createRef();

    this.debouncedResizeHandler = _.debounce(this.handleResize.bind(this), 50);
  }
  
  public componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.debouncedResizeHandler);
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.debouncedResizeHandler);
  }

  public render() {
    return (
      <div className="viewport" ref={this.viewportRef}>
        <Loading percent={this.props.loadingPercent} />      
        <Screencast height={this.props.height} width={this.props.width} frames={this.props.frames} />
      </div>
    );
  }

  private handleResize(e: any) {
    this.updateDimensions()    
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
