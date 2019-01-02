
import * as React from 'react';
import './viewport-info.css';

class ViewportInfo extends React.Component<any, any> {

  private timer: number
  
  constructor(props: any){
    super(props);

    this.state = {
      isHidden: false
    }
  }

  public componentWillReceiveProps() {
    this.setState({isHidden: false}); 
    window.clearTimeout(this.timer);
  }

  public render() {

    const height = Math.round(this.props.height);
    const width = Math.round(this.props.width);

    this.timer = window.setTimeout(_ => {
      this.setState({isHidden: true}); 
    }, 2000);    

    return (
      <div className={`viewport-info ${this.state.isHidden ? 'hidden' : ''}`}>
        {width}px 𝗑 {height}px
      </div>
    );
  }

}

export default ViewportInfo;



