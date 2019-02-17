import * as React from 'react';
import './screencast.css';

// This implementation is heavily inspired by https://cs.chromium.org/chromium/src/third_party/blink/renderer/devtools/front_end/screencast/ScreencastView.js

class Screencast extends React.Component<any, any> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private imageRef: React.RefObject<HTMLImageElement>;
  private canvasContext: CanvasRenderingContext2D | null;
  private frameId: number | null;
  private frame: string | null;

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();
    this.imageRef = React.createRef();
    this.canvasContext = null;
    this.frameId = null;
    this.frame = props.frame;

    this.handleMouseEvent = this.handleMouseEvent.bind(this);
    this.handleKeyEvent = this.handleKeyEvent.bind(this);
    this.renderLoop = this.renderLoop.bind(this);

    this.state = {
      imageZoom: 1,
      highlightInfo: null,
      screenOffsetTop: 0,
      screenZoom: 1
    };
  }

  static getDerivedStateFromProps(nextProps: any, prevState: any) {
    if (nextProps.frame !== prevState.frame) {
      return {
        frame: nextProps.frame
      };
    } else return null;
  }

  public componentDidUpdate(prevProps: any, prevState: any) {
    if (prevState.frame !== this.state.frame) {
      this.renderScreencastFrame();
    }
  }

  public componentDidMount() {
    this.startLoop();
  }

  public componentWillUnmount() {
    this.stopLoop();
  }

  public startLoop() {
    if (!this.frameId) {
      this.frameId = window.requestAnimationFrame(this.renderLoop);
    }
  }

  public stopLoop() {
    if (this.frameId) {
      window.cancelAnimationFrame(this.frameId);
    }
  }

  public renderLoop() {
    this.renderFrame();
    this.frameId = window.requestAnimationFrame(this.renderLoop); // Set up next iteration of the loop
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

  private renderFrame() {
    if (!this.canvasRef.current || !this.imageRef.current) {
      return;
    }

    this.canvasContext = this.canvasRef.current.getContext('2d');
    const canvasElement = this.canvasRef.current;
    const imageElement = this.imageRef.current;

    if (!this.canvasContext) {
      return;
    }

    const canvasWidth = this.props.width;
    const canvasHeight = this.props.height;
    const checkerboardPattern = this.getCheckerboardPattern(canvasElement, this.canvasContext);

    canvasElement.width = window.devicePixelRatio * canvasWidth;
    canvasElement.height = window.devicePixelRatio * canvasHeight;

    this.canvasContext.save();
    this.canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.canvasContext.save();
    this.canvasContext.fillStyle = checkerboardPattern;
    this.canvasContext.fillRect(0, 0, canvasWidth, this.state.screenOffsetTop * this.state.screenZoom);
    this.canvasContext.fillRect(
      0,
      this.state.screenOffsetTop * this.state.screenZoom + imageElement.naturalHeight * this.state.imageZoom,
      canvasWidth,
      canvasHeight
    );
    this.canvasContext.restore();

    // Render highlight
    let config = {
      contentColor: 'rgba(111, 168, 220, .66)',
      paddingColor: 'rgba(147, 196, 125, .55)',
      borderColor: 'rgba(255, 229, 153, .66)',
      marginColor: 'rgba(246, 178, 107, .66)'
    };

    if (this.state.highlightInfo) {
      let model = this.state.highlightInfo;
      this.canvasContext.save();
      const transparentColor = 'rgba(0, 0, 0, 0)';
      const quads = [];
      if (model.content && config.contentColor !== transparentColor)
        quads.push({ quad: model.content, color: config.contentColor });
      if (model.padding && config.paddingColor !== transparentColor)
        quads.push({ quad: model.padding, color: config.paddingColor });
      if (model.border && config.borderColor !== transparentColor)
        quads.push({ quad: model.border, color: config.borderColor });
      if (model.margin && config.marginColor !== transparentColor)
        quads.push({ quad: model.margin, color: config.marginColor });
      for (let i = quads.length - 1; i > 0; --i) {
        this.drawOutlinedQuadWithClip(this.canvasContext, quads[i].quad, quads[i - 1].quad, quads[i].color);
      }
      if (quads.length > 0) {
        this.drawOutlinedQuad(this.canvasContext, quads[0].quad, quads[0].color);
      }
      this.canvasContext.restore();
      this.canvasContext.globalCompositeOperation = 'destination-over';
    }

    // Render viewport frame
    let dy = this.state.screenOffsetTop * this.state.screenZoom;
    let dw = imageElement.naturalWidth * this.state.imageZoom;
    let dh = imageElement.naturalHeight * this.state.imageZoom;

    this.canvasContext.drawImage(imageElement, 0, dy, dw, dh);
    this.canvasContext.restore();
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

      let screenZoom = (imageElement.naturalWidth * imageZoom) / metadata.deviceWidth;

      const highlightInfo = this.props.highlightInfo ? this.scaleBoxModelToViewport(this.props.highlightInfo) : null;

      this.setState({
        imageZoom: imageZoom,
        highlightInfo: highlightInfo,
        screenOffsetTop: metadata.offsetTop,
        scrollOffsetX: metadata.scrollOffsetX,
        scrollOffsetY: metadata.scrollOffsetY,
        screenZoom: screenZoom
      });

      imageElement.src = 'data:image/jpg;base64,' + screencastFrame.base64Data;
    }
  }

  private getCheckerboardPattern(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): CanvasPattern {
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
    if (this.props.isInspectEnabled && event.type === 'click') {
      const position = this.convertIntoScreenSpace(event, this.state);
      this.props.onInspectElement({
        position: position
      });
    } else if (this.props.isInspectEnabled && event.type === 'mousemove') {
      const position = this.convertIntoScreenSpace(event, this.state);
      this.props.onInspectHighlightRequested({
        position: position
      });
    } else {
      this.dispatchMouseEvent(event.nativeEvent);
    }

    if (event.type === 'mousedown') {
      if (this.canvasRef.current) {
        this.canvasRef.current.focus();
      }
    }
  }

  private convertIntoScreenSpace(event: any, state: any) {
    let screenOffsetTop = 0;
    if (this.canvasRef && this.canvasRef.current) {
      screenOffsetTop = this.canvasRef.current.getBoundingClientRect().top;
    }

    return {
      x: Math.round(event.clientX / state.screenZoom + this.state.scrollOffsetX),
      y: Math.round(event.clientY / state.screenZoom - screenOffsetTop + this.state.scrollOffsetY)
    };
  }

  private quadToPath(context: any, quad: any) {
    context.beginPath();
    context.moveTo(quad[0], quad[1]);
    context.lineTo(quad[2], quad[3]);
    context.lineTo(quad[4], quad[5]);
    context.lineTo(quad[6], quad[7]);
    context.closePath();
    return context;
  }

  private drawOutlinedQuad(context: any, quad: any, fillColor: any) {
    context.save();
    context.lineWidth = 2;
    this.quadToPath(context, quad).clip();
    context.fillStyle = fillColor;
    context.fill();
    context.restore();
  }

  private drawOutlinedQuadWithClip(context: any, quad: any, clipQuad: any, fillColor: any) {
    context.fillStyle = fillColor;
    context.save();
    context.lineWidth = 0;
    this.quadToPath(context, quad).fill();
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = 'red';
    this.quadToPath(context, clipQuad).fill();
    context.restore();
  }

  private scaleBoxModelToViewport(model: any) {
    let zoomFactor = this.state.screenZoom;
    let offsetTop = this.state.screenOffsetTop;

    function scaleQuad(quad: any) {
      for (let i = 0; i < quad.length; i += 2) {
        quad[i] = quad[i] * zoomFactor;
        quad[i + 1] = (quad[i + 1] + offsetTop) * zoomFactor;
      }
    }

    scaleQuad.call(this, model.content);
    scaleQuad.call(this, model.padding);
    scaleQuad.call(this, model.border);
    scaleQuad.call(this, model.margin);

    return model;
  }

  private handleKeyEvent(event: any) {
    this.emitKeyEvent(event.nativeEvent);

    if (event.key === 'Tab') {
      event.preventDefault();
    }

    if (this.canvasRef.current) {
      this.canvasRef.current.focus();
    }
  }

  private modifiersForEvent(event: any) {
    return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
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

    const text = event.type === 'keypress' ? String.fromCharCode(event.charCode) : undefined;
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
