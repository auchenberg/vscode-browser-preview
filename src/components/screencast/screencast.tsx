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
  }
  
  public componentDidMount() {
    if(this.canvasRef.current) {
      this.canvasContext = this.canvasRef.current.getContext('2d');
    }
  }
  
  public render() {
    this.paint();
    console.log('screencast.render', this.props)
    return (
      <>
        <img ref={this.imageRef} className="hidden" />
        <canvas className="screencast" ref={this.canvasRef} />
      </>
    );
  }

  private paint() {
    const canvasElement = this.canvasRef.current;

    if(canvasElement && this.canvasContext) {

      const checkerboardPattern = this.getCheckerboardPattern(canvasElement, this.canvasContext);
      const canvasWidth = this.props.width;
      const canvasHeight = this.props.height;

      canvasElement.width = window.devicePixelRatio * canvasWidth;
      canvasElement.height = window.devicePixelRatio * canvasHeight;
      
      this.canvasContext.save();
      this.canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Paint top and bottom gutter.
      this.canvasContext.save();
      this.canvasContext.fillStyle = checkerboardPattern;
      this.canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
      this.canvasContext.restore();

    }

    // this._context.drawImage(
    //     this._imageElement, 0, this._screenOffsetTop * this._screenZoom,
    //     this._imageElement.naturalWidth * this._imageZoom, this._imageElement.naturalHeight * this._imageZoom);
    // this._context.restore();  
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
