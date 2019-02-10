import * as React from 'react';
import './url-input.css';

interface IUrlInputState {
  isFocused: boolean;
  hasChanged: boolean;
  url: string;
}

class UrlInput extends React.Component<any, IUrlInputState> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasChanged: false,
      isFocused: false,
      url: this.props.url
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.url !== this.state.url && !this.state.hasChanged) {
      this.setState({
        url: nextProps.url
      });
    }
  }

  public render() {
    const className = ['urlbar'];
    if (this.state.isFocused) {
      className.push('focused');
    }

    return (
      <div className={className.join(' ')}>
        <input
          type="text"
          value={this.state.url}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
        />
      </div>
    );
  }

  private handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      url: e.target.value,
      hasChanged: true
    });
  }

  private handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
    this.setState({
      isFocused: true
    });
  }

  private handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    this.setState({
      isFocused: false
    });
  }

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {
      // Enter

      let url = this.state.url;
      let schemeRegex = /^(https?|about|chrome|file):/;

      if (!url.match(schemeRegex)) {
        url = 'http://' + this.state.url;
      }

      this.setState({
        hasChanged: false
      });

      this.props.onUrlChanged(url);
    }
  }
}

export default UrlInput;
