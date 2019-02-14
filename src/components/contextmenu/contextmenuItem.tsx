import * as React from 'react';
import {
  IContextMenuItemProps,
  IContextMenuItemState,
  ContextMenuItemsType
} from './contextmenu-models';

class ContextMenuItem extends React.Component<
  IContextMenuItemProps,
  IContextMenuItemState
> {
  constructor(props: IContextMenuItemProps) {
    super(props);
    this.state = {
      itemType: this.props.itemType,
      isDisabled: this.props.isDisabled || false
    };

    this.handleClick = this.handleClick.bind(this);
  }

  componentWillReceiveProps(nextProps: IContextMenuItemProps) {
    if (nextProps.isDisabled !== this.state.isDisabled) {
      this.setState({
        isDisabled: nextProps.isDisabled
      });
    }
  }

  private handleClick(event: React.MouseEvent<HTMLLIElement>) {
    this.props.handleClick(event);
    this.props.setVisibility(false);
  }

  public render() {
    const className = ['contextMenuItem'];
    if (this.state.isDisabled) {
      className.push('disabled');
    }
    if (this.state.itemType === ContextMenuItemsType.Seperator) {
      className.push('disabled');
      className.push('separator');
    }

    if (this.state.itemType === ContextMenuItemsType.Seperator) {
      return <li className={className.join(' ')} />;
    } else {
      return (
        <li className={className.join(' ')} onClick={this.handleClick}>
          {this.state.itemType}
        </li>
      );
    }
  }
}

export default ContextMenuItem;
