import * as React from 'react';
import './screencast.css';

// This implementation is heavily inspired by https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/screencast/ScreencastView.js

class Screencast extends React.Component<any, any> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private imageRef: React.RefObject<HTMLImageElement>;
  private canvasContext: CanvasRenderingContext2D | null;

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();
    this.imageRef = React.createRef();
    this.canvasContext = null;

    this.handleMouseEvent = this.handleMouseEvent.bind(this);
    this.handleKeyEvent = this.handleKeyEvent.bind(this);

    this.state = {
      screenOffsetTop: 0,
      imageZoom: 1,
      screenZoom: 1
    };
  }

  public componentDidMount() {
    if (this.canvasRef.current) {
      this.canvasContext = this.canvasRef.current.getContext('2d');
    }
  }

  public render() {
    return (
      <>
        <img ref={this.imageRef} className="img-hidden" />
        <canvas
          className="screencast"
          ref={this.canvasRef}
          onMouseDown={this.handleMouseEvent}
          onMouseUp={this.handleMouseEvent}
          onMouseMove={this.handleMouseEvent}
          onClick={this.handleMouseEvent}
          onWheel={this.handleMouseEvent}
          onKeyDown={this.handleKeyEvent}
          onKeyUp={this.handleKeyEvent}
          onKeyPress={this.handleKeyEvent}
          tabIndex={0}
        />
      </>
    );
  }

  public componentWillReceiveProps() {
    this.renderScreencastFrame();
  }

  private paint() {
    const canvasElement = this.canvasRef.current;
    const imageElement = this.imageRef.current;

    if (imageElement && canvasElement && this.canvasContext) {
      const checkerboardPattern = this.getCheckerboardPattern(
        canvasElement,
        this.canvasContext
      );
      const canvasWidth = this.props.width;
      const canvasHeight = this.props.height;

      canvasElement.width = window.devicePixelRatio * canvasWidth;
      canvasElement.height = window.devicePixelRatio * canvasHeight;

      this.canvasContext.save();
      this.canvasContext.scale(
        window.devicePixelRatio,
        window.devicePixelRatio
      );

      this.canvasContext.save();
      this.canvasContext.fillStyle = checkerboardPattern;

      this.canvasContext.fillRect(
        0,
        0,
        canvasWidth,
        this.state.screenOffsetTop * this.state.screenZoom
      );
      this.canvasContext.fillRect(
        0,
        this.state.screenOffsetTop * this.state.screenZoom +
          imageElement.naturalHeight * this.state.imageZoom,
        canvasWidth,
        canvasHeight
      );
      this.canvasContext.restore();

      let dy = this.state.screenOffsetTop * this.state.screenZoom;
      let dw = imageElement.naturalWidth * this.state.imageZoom;
      let dh = imageElement.naturalHeight * this.state.imageZoom;

      this.canvasContext.drawImage(imageElement, 0, dy, dw, dh);
      this.canvasContext.restore();
    }
  }

  public renderScreencastFrame() {
    const screencastFrame = this.props.frame;

    const imageElement = this.imageRef.current;

    if (imageElement && screencastFrame) {
      const canvasWidth = this.props.width;
      const canvasHeight = this.props.height;
      const metadata = screencastFrame.metadata;

      const deviceSizeRatio = metadata.deviceHeight / metadata.deviceWidth;

      let imageZoom = Math.min(
        canvasWidth / imageElement.naturalWidth,
        canvasHeight / (imageElement.naturalWidth * deviceSizeRatio)
      );

      if (imageZoom < 1.01 / window.devicePixelRatio) {
        imageZoom = 1 / window.devicePixelRatio;
      }

      let screenZoom =
        (imageElement.naturalWidth * imageZoom) / metadata.deviceWidth;

      this.setState({
        imageZoom: imageZoom,
        screenOffsetTop: metadata.offsetTop,
        screenZoom: screenZoom
      });

      if (imageElement) {
        imageElement.onload = () => {
          this.paint();
        };
        imageElement.src =
          'data:image/jpg;base64,' + screencastFrame.base64Data;
      }
    }
  }

  private getCheckerboardPattern(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ): CanvasPattern {
    const pattern = canvas;
    const size = 32;
    const pctx = pattern.getContext('2d');

    // Pattern size
    pattern.width = size * 2;
    pattern.height = size * 2;

    if (pctx) {
      // Dark grey
      pctx.fillStyle = 'rgb(195, 195, 195)';
      pctx.fillRect(0, 0, size * 2, size * 2);

      // Light grey
      pctx.fillStyle = 'rgb(225, 225, 225)';
      pctx.fillRect(0, 0, size, size);
      pctx.fillRect(size, size, size, size);
    }

    let result = context.createPattern(pattern, 'repeat');
    if (result) {
      return result;
    } else {
      return new CanvasPattern();
    }
  }

  private handleMouseEvent(event: any) {
    this.dispatchMouseEvent(event.nativeEvent);

    if (event.type === 'mousedown') {
      if (this.canvasRef.current) {
        this.canvasRef.current.focus();
      }
    }
  }

  private handleKeyEvent(event: any) {
    this.emitKeyEvent(event.nativeEvent);
    if (this.canvasRef.current) {
      this.canvasRef.current.focus();
    }
  }

  private modifiersForEvent(event: any) {
    return (
      (event.altKey ? 1 : 0) |
      (event.ctrlKey ? 2 : 0) |
      (event.metaKey ? 4 : 0) |
      (event.shiftKey ? 8 : 0)
    );
  }

  private emitKeyEvent(event: any) {
    let type;
    switch (event.type) {
      case 'keydown':
        type = 'keyDown';
        break;
      case 'keyup':
        type = 'keyUp';
        break;
      case 'keypress':
        type = 'char';
        break;
      default:
        return;
    }

    const text =
      event.type === 'keypress'
        ? String.fromCharCode(event.charCode)
        : undefined;
    var params = {
      type: type,
      modifiers: this.modifiersForEvent(event),
      text: text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      keyIdentifier: event.keyIdentifier,
      code: event.code,
      key: event.key,
      windowsVirtualKeyCode: event.keyCode,
      nativeVirtualKeyCode: event.keyCode,
      autoRepeat: false,
      isKeypad: false,
      isSystemKey: false
    };

    this.props.onInteraction('Input.dispatchKeyEvent', params);
  }

  private dispatchMouseEvent(event: any) {
    let clickCount = 0;
    const buttons = { 0: 'none', 1: 'left', 2: 'middle', 3: 'right' };
    const types = {
      mousedown: 'mousePressed',
      mouseup: 'mouseReleased',
      mousemove: 'mouseMoved',
      wheel: 'mouseWheel'
    };

    if (!(event.type in types)) {
      return;
    }

    let type = (types as any)[event.type];

    if (type == 'mousePressed' || type == 'mouseReleased') {
      clickCount = 1;
    }

    const params = {
      type: type,
      x: event.offsetX,
      y: event.offsetY,
      modifiers: this.modifiersForEvent(event),
      button: (buttons as any)[event.which],
      clickCount: clickCount,
      deltaX: 0,
      deltaY: 0
    };

    if (type === 'mouseWheel') {
      params.deltaX = event.deltaX;
      params.deltaY = event.deltaY;
    }

    this.props.onInteraction('Input.dispatchMouseEvent', params);
  }
}

export default Screencast;
