import * as React from 'react';
import './viewport.css';

import Loading from '../loading-bar/loading-bar';
import Screencast from '../screencast/screencast';
import ViewportInfo from '../viewport-info/viewport-info';
import * as _ from 'lodash';

class Viewport extends React.Component<any, any> {
  private viewportRef: React.RefObject<HTMLDivElement>;
  private debouncedResizeHandler: any;

  constructor(props: any) {
    super(props);
    this.viewportRef = React.createRef();

    this.debouncedResizeHandler = _.debounce(this.handleResize.bind(this), 50);
    this.handleInspectElement = this.handleInspectElement.bind(this);
    this.handleInspectHighlightRequested = this.handleInspectHighlightRequested.bind(
      this
    );
    this.handleScreencastInteraction = this.handleScreencastInteraction.bind(
      this
    );
  }

  public componentDidMount() {
    this.updateDimensions();
    window.addEventListener('resize', this.debouncedResizeHandler);
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.debouncedResizeHandler);
  }

  public render() {
    return (
      <div className="viewport" ref={this.viewportRef}>
        <Loading percent={this.props.loadingPercent} />
        <ViewportInfo height={this.props.height} width={this.props.width} />
        <Screencast
          height={this.props.height}
          width={this.props.width}
          frame={this.props.frame}
          highlightInfo={this.props.highlightInfo}
          isInspectEnabled={this.props.isInspectEnabled}
          onInspectElement={this.handleInspectElement}
          onInspectHighlightRequested={this.handleInspectHighlightRequested}
          onInteraction={this.handleScreencastInteraction}
        />
      </div>
    );
  }

  private handleResize(e: any) {
    this.updateDimensions();
  }

  private handleInspectElement(params: object) {
    this.props.onViewportChanged('inspectElement', {
      params: params
    });
  }

  private handleInspectHighlightRequested(params: object) {
    this.props.onViewportChanged('inspectHighlightRequested', {
      params: params
    });
  }

  private handleScreencastInteraction(action: string, params: object) {
    this.props.onViewportChanged('interaction', {
      action: action,
      params: params
    });
  }

  private updateDimensions() {
    if (this.viewportRef.current) {
      const dim = this.viewportRef.current.getBoundingClientRect();

      this.props.onViewportChanged('size', {
        height: dim.height,
        width: dim.width
      });
    }
  }
}

export default Viewport;
