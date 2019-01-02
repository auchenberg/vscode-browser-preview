
import * as React from 'react';
import './url-input.css';

interface IUrlInputState {
  isFocused: boolean,
  url: string
}

class UrlInput extends React.Component<any, IUrlInputState> {

  constructor(props: any){
    super(props);
    this.state = { 
      isFocused: false,
      url: this.props.url
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);    
    this.handleKeyDown = this.handleKeyDown.bind(this);    
}

public render() {

    const className = ['urlbar'];
    if (this.state.isFocused) {
      className.push('focused');
    }
 
    return (
      <div className={className.join(' ')}>
          <input type="text" value={this.state.url} onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.handleChange} onKeyDown={this.handleKeyDown}  />
      </div>
    );
  }

  private handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      url: e.target.value
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
      this.props.onUrlChanged(this.state.url)
    }
  }
}

export default UrlInput;



