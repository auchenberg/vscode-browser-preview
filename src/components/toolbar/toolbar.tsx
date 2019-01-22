import * as React from 'react';
import './toolbar.css';

import UrlInput from '../url-input/url-input';

const iconBackwardStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNDI3IDIzNC42MjVIMTY3LjI5NmwxMTkuNzAyLTExOS43MDJMMjU2IDg1IDg1IDI1NmwxNzEgMTcxIDI5LjkyMi0yOS45MjQtMTE4LjYyNi0xMTkuNzAxSDQyN3YtNDIuNzV6Ii8+PC9zdmc+)`
};

const iconForwardStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNODUgMjc3LjM3NWgyNTkuNzA0TDIyNS4wMDIgMzk3LjA3NyAyNTYgNDI3bDE3MS0xNzFMMjU2IDg1bC0yOS45MjIgMjkuOTI0IDExOC42MjYgMTE5LjcwMUg4NXY0Mi43NXoiLz48L3N2Zz4=)`
};

const iconRefreshStyle = {
  backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDM4OGMtNzIuNTk3IDAtMTMyLTU5LjQwNS0xMzItMTMyIDAtNzIuNjAxIDU5LjQwMy0xMzIgMTMyLTEzMiAzNi4zIDAgNjkuMjk5IDE1LjQgOTIuNDA2IDM5LjYwMUwyNzggMjM0aDE1NFY4MGwtNTEuNjk4IDUxLjcwMkMzNDguNDA2IDk5Ljc5OCAzMDQuNDA2IDgwIDI1NiA4MGMtOTYuNzk3IDAtMTc2IDc5LjIwMy0xNzYgMTc2czc4LjA5NCAxNzYgMTc2IDE3NmM4MS4wNDUgMCAxNDguMjg3LTU0LjEzNCAxNjkuNDAxLTEyOEgzNzguODVjLTE4Ljc0NSA0OS41NjEtNjcuMTM4IDg0LTEyMi44NSA4NHoiLz48L3N2Zz4=)`
};

interface IToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  url: string;
  onActionInvoked: (action: string, data: object) => void;
}

class Toolbar extends React.Component<IToolbarProps> {
  constructor(props: any) {
    super(props);

    this.handleBack = this.handleBack.bind(this);
    this.handleForward = this.handleForward.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
  }

  public render() {
    return (
      <div className="toolbar">
        <div className="inner">
          <button
            className="backward"
            style={iconBackwardStyle}
            onClick={this.handleBack}
            disabled={this.props.canGoBack}
          >
            Backward
          </button>
          <button
            className="forward"
            style={iconForwardStyle}
            onClick={this.handleForward}
            disabled={this.props.canGoForward}
          >
            Forward
          </button>
          <button
            className="refresh"
            style={iconRefreshStyle}
            onClick={this.handleRefresh}
          >
            Refresh
          </button>
          <UrlInput url={this.props.url} onUrlChanged={this.handleUrlChange} />
        </div>
      </div>
    );
  }

  private handleUrlChange(url: string) {
    this.props.onActionInvoked('urlChange', { url });
  }

  private handleBack() {
    this.props.onActionInvoked('backward', {});
  }

  private handleForward() {
    this.props.onActionInvoked('forward', {});
  }

  private handleRefresh() {
    this.props.onActionInvoked('refresh', {});
  }
}

export default Toolbar;
