import * as React from 'react';
import ContextMenu from '../contextmenu/contextmenu';
import { IContextMenuProps } from '../contextmenu/contextmenu-models';
import './url-input.css';

interface IUrlInputState {
  isFocused: boolean;
  hasChanged: boolean;
  url: string;
  urlSelectionStart: number | null;
  urlSelectionEnd: number | null;
  contextMenuProps: IContextMenuProps;
}

class UrlInput extends React.Component<any, IUrlInputState> {
  private ref?: HTMLInputElement;
  constructor(props: any) {
    super(props);
    this.state = {
      hasChanged: false,
      isFocused: false,
      url: this.props.url,
      urlSelectionStart: 0,
      urlSelectionEnd: 0,
      contextMenuProps: {
        menuItems: [],
        isVisible: false,
        position: { x: 0, y: 0 },
        setVisibility: this.setVisibility.bind(this),
        setUrl: this.setUrl.bind(this),
        enterUrl: this.enterUrl.bind(this),
        selectUrl: this.selectUrl.bind(this),
        onActionInvoked: this.props.onActionInvoked,
        selectedUrlInput: ''
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    this.setRef = this.setRef.bind(this);
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.url !== this.state.url && !this.state.hasChanged) {
      this.setState({
        url: nextProps.url
      });
    }
  }

  //changing ContextMenu visibility status from child components
  public setVisibility(value: boolean) {
    this.setState({
      contextMenuProps: {
        ...this.state.contextMenuProps,
        isVisible: value
      }
    });
  }

  //changing url from child components
  public setUrl(value: string) {
    // if selectionStart and selectionEnd are available, then we have to
    // only modify that part of the url
    let newCursorPosition: number | null = null;
    if (this.state.urlSelectionStart && this.state.urlSelectionEnd) {
      let _url: string = this.state.url;
      let firstPart: string = _url.slice(0, this.state.urlSelectionStart);
      let secondPart: string = _url.slice(this.state.urlSelectionEnd);

      //set newCursorPosition
      newCursorPosition = (firstPart + value).length;

      value = firstPart + value + secondPart;
    } else if (this.state.urlSelectionStart) {
      let _url: string = this.state.url;
      let firstPart: string = _url.slice(0, this.state.urlSelectionStart);
      let secondPart: string = _url.slice(this.state.urlSelectionStart);

      //set newCursorPosition
      newCursorPosition = (firstPart + value).length;

      value = firstPart + value + secondPart;
    }

    if (value !== this.state.url) {
      this.setState({
        url: value,
        hasChanged: true,
        isFocused: true
      });

      //set urlCursorPosition
      if (this.ref && newCursorPosition) {
        this.ref.focus();
        this.ref.setSelectionRange(newCursorPosition, newCursorPosition);
      }
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
          ref={this.setRef}
          value={this.state.url}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onContextMenu={this.handleContextMenu}
        />
        <ContextMenu {...this.state.contextMenuProps} />
      </div>
    );
  }

  private setRef(node: HTMLInputElement) {
    this.ref = node;
  }

  private handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      url: e.target.value,
      hasChanged: true
    });
  }

  private handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    this.selectUrl(e.target);
  }

  //select all url from child components
  private selectUrl(element?: HTMLInputElement) {
    if (!element && this.ref) element = this.ref;

    if (element) {
      element.select();
      this.setState({
        isFocused: true
      });
    }
  }

  private handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    this.setState({
      isFocused: false
    });
  }

  private handleContextMenu(e: React.MouseEvent<HTMLInputElement>) {
    e.preventDefault();
    this.setState({
      urlSelectionStart: (e.currentTarget as HTMLInputElement).selectionStart,
      urlSelectionEnd: (e.currentTarget as HTMLInputElement).selectionEnd,
      contextMenuProps: {
        ...this.state.contextMenuProps,
        isVisible: true,
        position: {
          x: e.clientX,
          y: e.clientY
        },
        selectedUrlInput: this.state.isFocused
          ? window.getSelection().toString()
          : ''
      }
    });
  }

  private enterUrl() {
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

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {
      // Enter
      this.enterUrl();
    }
  }
}

export default UrlInput;
