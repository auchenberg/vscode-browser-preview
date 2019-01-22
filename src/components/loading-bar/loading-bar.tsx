import * as React from 'react';
import './loading-bar.css';

interface ILoadingBarState {
  percent: number;
}

class LoadingBar extends React.Component<any, ILoadingBarState> {
  constructor(props: any) {
    super(props);
  }

  public render() {
    return (
      <div className="loading-bar">
        <div className="bar" style={this.getBarStyle()}>
          <div className="peg" />
        </div>
      </div>
    );
  }

  private getBarStyle() {
    const { percent } = this.props;

    return {
      display: percent > 0 ? 'block' : 'none',
      width: `${percent * 100}%`
    };
  }
}

export default LoadingBar;
