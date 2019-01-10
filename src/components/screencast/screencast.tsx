import * as React from 'react';
import './screencast.css';

class Screencast extends React.Component<any, any> {

  private canvasRef: React.RefObject<HTMLCanvasElement>
  private imageRef: React.RefObject<HTMLImageElement>
  private canvasContext: CanvasRenderingContext2D | null;

  constructor(props: any){
    super(props);
    this.canvasRef = React.createRef();
    this.imageRef = React.createRef();

    this.state = {
      screenOffsetTop: 0,
      imageZoom: 1,
      screenZoom: 1
    }
  }
  
  public componentDidMount() {
    if(this.canvasRef.current) {
      this.canvasContext = this.canvasRef.current.getContext('2d');
    }
  }
  
  public render() {
    // this.paint();
    return (
      <>
        <img ref={this.imageRef} className="img-hidden" />
        <canvas className="screencast" ref={this.canvasRef} />
      </>
    );
  }

  public componentWillReceiveProps() {
    this.loadScreencastFrame();
  }

  private paint() {
    const canvasElement = this.canvasRef.current;
    const imageElement = this.imageRef.current;

    if(imageElement && canvasElement && this.canvasContext) {

      const checkerboardPattern = this.getCheckerboardPattern(canvasElement, this.canvasContext);
      const canvasWidth = this.props.width;
      const canvasHeight = this.props.height;

      canvasElement.width = window.devicePixelRatio * canvasWidth;
      canvasElement.height = window.devicePixelRatio * canvasHeight;
      
      this.canvasContext.save();
      this.canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

      this.canvasContext.save();
      this.canvasContext.fillStyle = checkerboardPattern;

      this.canvasContext.fillRect(0, 0, canvasWidth, this.state.screenOffsetTop * this.state.screenZoom);
      this.canvasContext.fillRect(0, this.state.screenOffsetTop * this.state.screenZoom + imageElement.naturalHeight * this.state.imageZoom, canvasWidth, canvasHeight);
      // this.canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
      this.canvasContext.restore();

      let dy = this.state.screenOffsetTop * this.state.screenZoom;
      let dw = imageElement.naturalWidth * this.state.imageZoom;
      let dh = imageElement.naturalHeight * this.state.imageZoom;

      this.canvasContext.drawImage(imageElement, 0,  dy, dw, dh);
      // this.canvasContext.drawImage(imageElement, 0,  0, canvasWidth, canvasHeight);
      this.canvasContext.restore();

        console.log('dy', dy)
        console.log('dw', dw)
        console.log('dh', dh)

        console.log('imageElement', imageElement.naturalWidth, imageElement.naturalHeight);
        console.log('canvas', canvasWidth, canvasHeight);
        console.log('this.state.imageZoom', this.state.imageZoom);
        console.log('this.state.screenZoom', this.state.screenZoom);
    }

  }  

  public loadScreencastFrame() {
    const lastFrame = this.props.frames.pop();
    const imageElement = this.imageRef.current;

    if(imageElement && lastFrame) {
      const canvasWidth = this.props.width;
      const canvasHeight = this.props.height;
      const metadata = lastFrame.metadata;

      const deviceSizeRatio = metadata.deviceHeight / metadata.deviceWidth;

      let imageZoom = Math.min(
        canvasWidth / imageElement.naturalWidth,
        canvasHeight / (imageElement.naturalWidth * deviceSizeRatio));
        
      if (imageZoom < 1.01 / window.devicePixelRatio) {
        imageZoom = 1 / window.devicePixelRatio;
      }

      let screenZoom = imageElement.naturalWidth * imageZoom / metadata.deviceWidth;
        
      this.setState({
        imageZoom: imageZoom,
        screenOffsetTop: metadata.offsetTop,
        screenZoom: screenZoom,
      })

      if(imageElement) {
        imageElement.onload = () => {
          this.paint();
        };
        imageElement.src = 'data:image/jpg;base64,' + lastFrame.base64Data;
      }
    }
  }
  
  private getCheckerboardPattern(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {

    const pattern = canvas;    
    const size = 32;
    const pctx = pattern.getContext('2d');
    
    // Pattern size
    pattern.width = size * 2;
    pattern.height = size * 2;
    
    if(pctx){
      // Dark grey
      pctx.fillStyle = 'rgb(195, 195, 195)';
      pctx.fillRect(0, 0, size * 2, size * 2);

      // Light grey
      pctx.fillStyle = 'rgb(225, 225, 225)';
      pctx.fillRect(0, 0, size, size);
      pctx.fillRect(size, size, size, size);
    }

    return context.createPattern(pattern, 'repeat');
  }

}

export default Screencast;
