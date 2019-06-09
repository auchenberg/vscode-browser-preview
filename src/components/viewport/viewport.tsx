import * as React from 'react';
import './viewport.css';

import Loading from '../loading-bar/loading-bar';
import Resizable from 're-resizable';
import Screencast from '../screencast/screencast';
import ViewportInfo from '../viewport-info/viewport-info';

import debounce from 'lodash/debounce';

class Viewport extends React.Component<any, any> {
  private viewportRef: React.RefObject<HTMLDivElement>;
  private viewportMetadata: any;
  private debouncedResizeHandler: any;
  private viewportPadding: any;

  constructor(props: any) {
    super(props);
    this.viewportRef = React.createRef();
    this.viewportPadding = {
      top: 70,
      left: 30,
      right: 30,
      bottom: 30
    };

    this.debouncedResizeHandler = debounce(this.handleViewportResize.bind(this), 50);
    this.handleInspectElement = this.handleInspectElement.bind(this);
    this.handleInspectHighlightRequested = this.handleInspectHighlightRequested.bind(this);
    this.handleScreencastInteraction = this.handleScreencastInteraction.bind(this);
    this.handleResizeStop = this.handleResizeStop.bind(this);
    this.handleMouseMoved = this.handleMouseMoved.bind(this);
  }

  public componentDidMount() {
    this.debouncedResizeHandler();
    window.addEventListener('resize', this.debouncedResizeHandler);
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.debouncedResizeHandler);
  }

  public render() {
    this.viewportMetadata = this.props.viewport;

    let width = this.viewportMetadata.width * this.viewportMetadata.screenZoom;
    let height = this.viewportMetadata.height * this.viewportMetadata.screenZoom;

    let resizableEnableOptions = {
      top: false,
      right: false,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false
    };

    if (this.viewportMetadata.isResizable) {
      resizableEnableOptions = {
        top: true,
        topRight: true,
        topLeft: true,
        bottom: true,
        bottomRight: true,
        bottomLeft: true,
        left: true,
        right: true
      };
    }

    let renderer = (
      <Screencast
        height={height}
        width={width}
        frame={this.props.frame}
        format={this.props.format}
        viewportMetadata={this.viewportMetadata}
        isInspectEnabled={this.props.isInspectEnabled}
        onInspectElement={this.handleInspectElement}
        onInspectHighlightRequested={this.handleInspectHighlightRequested}
        onInteraction={this.handleScreencastInteraction}
        onMouseMoved={this.handleMouseMoved}
      />
    );

    return (
      <div
        className={`viewport ` + (this.props.isDeviceEmulationEnabled ? `viewport-resizable` : ``)}
        ref={this.viewportRef}
      >
        <Loading percent={this.viewportMetadata.loadingPercent} />
        <ViewportInfo height={this.viewportMetadata.height} width={this.viewportMetadata.width} />
        <Resizable
          className="viewport-resizable-wrap"
          size={{
            width: width,
            height: height
          }}
          onResizeStop={this.handleResizeStop}
          enable={resizableEnableOptions}
          handleClasses={{
            bottom: 'viewport-resizer resizer-bottom',
            bottomRight: 'viewport-resizer resizer-bottom-right',
            bottomLeft: 'viewport-resizer resizer-bottom-left',
            left: 'viewport-resizer resizer-left',
            right: 'viewport-resizer resizer-right',
            top: 'viewport-resizer resizer-top',
            topRight: 'viewport-resizer resizer-top-right',
            topLeft: 'viewport-resizer resizer-top-left'
          }}
        >
          {renderer}
        </Resizable>
      </div>
    );
  }

  public calculateViewport() {
    console.log('viewport.calculateViewport');
    this.calculateViewportSize();
    this.calculateViewportZoom();
  }

  private calculateViewportZoom() {
    let screenZoom = 1;

    if (this.viewportMetadata.isFixedZoom) {
      return;
    }

    if (this.viewportMetadata.isFixedSize) {
      const screenViewportDimensions = {
        height: window.innerHeight - 38, // TODO: Remove hardcoded toolbar height
        width: window.innerWidth
      };

      if (this.props.isDeviceEmulationEnabled) {
        // Add padding to enable space for resizers
        screenViewportDimensions.width =
          screenViewportDimensions.width - this.viewportPadding.left - this.viewportPadding.right;
        screenViewportDimensions.height =
          screenViewportDimensions.height - this.viewportPadding.bottom - this.viewportPadding.top;
      }

      screenZoom = Math.min(
        screenViewportDimensions.width / this.viewportMetadata.width,
        screenViewportDimensions.height / this.viewportMetadata.height
      );
    }

    if (screenZoom === this.viewportMetadata.screenZoom) {
      return;
    }

    console.log('viewport.calculateViewportZoom.emitChange');

    this.emitViewportChanges({
      screenZoom: screenZoom
    });
  }

  private calculateViewportSize() {
    if (this.viewportMetadata.isFixedSize) {
      return;
    }

    if (this.viewportRef.current) {
      const dim = this.viewportRef.current.getBoundingClientRect();

      let viewportWidth = dim.width;
      let viewportHeight = dim.height;

      if (this.props.isDeviceEmulationEnabled) {
        // Add padding to enable space for resizers
        viewportWidth = viewportWidth - this.viewportPadding.left - this.viewportPadding.right;
        viewportHeight = viewportHeight - this.viewportPadding.bottom - this.viewportPadding.top;
      }

      viewportHeight = this.roundNumber(viewportHeight);
      viewportWidth = this.roundNumber(viewportWidth);

      if (
        viewportWidth === this.roundNumber(this.viewportMetadata.width) &&
        viewportHeight === this.roundNumber(this.viewportMetadata.height)
      ) {
        return;
      }

      console.log('viewport.calculateViewportSize.emitChange');

      this.emitViewportChanges({
        width: viewportWidth,
        height: viewportHeight
      });
    }
  }

  private handleViewportResize() {
    console.log('viewport.handleViewportResize');
    this.calculateViewport();
  }

  private handleResizeStop(e: any, direction: any, ref: any, delta: any) {
    this.emitViewportChanges({
      width: this.viewportMetadata.width + delta.width,
      height: this.viewportMetadata.height + delta.height,
      isFixedSize: true
    });
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

  private handleMouseMoved(params: object) {
    this.props.onViewportChanged('hoverElementChanged', {
      params: params
    });
  }

  private roundNumber(value: number) {
    return Math.floor(value);
  }

  private emitViewportChanges(newViewport: any) {
    this.props.onViewportChanged('size', newViewport);
  }
}

export default Viewport;
