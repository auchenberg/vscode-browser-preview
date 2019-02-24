import * as React from 'react';
import './viewport-info.css';

class ViewportInfo extends React.Component<any, any> {
  private timer: number;

  constructor(props: any) {
    super(props);
    this.timer = 0;

    this.state = {
      isHidden: false
    };
  }

  public componentWillReceiveProps(nextProps: any) {
    if (nextProps.height !== this.props.height || nextProps.width !== this.props.width) {
      this.setState({ isHidden: false });
      window.clearTimeout(this.timer);
    }
  }

  public render() {
    const height = Math.round(this.props.height);
    const width = Math.round(this.props.width);

    this.timer = window.setTimeout(() => {
      this.setState({ isHidden: true });
    }, 5000);

    return (
      <div className={`viewport-info ${this.state.isHidden ? 'hidden' : ''}`}>
        {width}px 𝗑 {height}px
      </div>
    );
  }
}

export default ViewportInfo;
