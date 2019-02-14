import * as React from 'react';
import {
  IContextMenu,
  IContextMenuProps,
  ContextMenuItemsType
} from './contextmenu-models';
import ContextMenuItem from './contextmenuItem';

class ContextMenu extends React.Component<IContextMenuProps, IContextMenu> {
  private ref?: HTMLUListElement;
  constructor(props: IContextMenuProps) {
    super(props);
    this.state = {
      isVisible: false,
      position: {
        x: 0,
        y: 0
      },
      //assign menuItems
      menuItems: [
        {
          itemType: ContextMenuItemsType.Cut,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.CutHandler(e)
        },
        {
          itemType: ContextMenuItemsType.Copy,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.CopyHandler(e)
        },
        {
          itemType: ContextMenuItemsType.Paste,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.PasteHandler(e)
        },
        {
          itemType: ContextMenuItemsType.PasteAndGo,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.PasteGoHandler(e)
        },
        {
          itemType: ContextMenuItemsType.Delete,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.DeleteHandler(e)
        },
        {
          itemType: ContextMenuItemsType.Seperator,
          setVisibility: this.props.setVisibility,
          handleClick: () => {}
        },
        {
          itemType: ContextMenuItemsType.SelectAll,
          setVisibility: this.props.setVisibility,
          handleClick: (e) => this.SelectAllHandler(e)
        }
      ]
    };

    this.setRef = this.setRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentWillReceiveProps(nextProps: IContextMenuProps) {
    if (
      nextProps.position.x !== this.state.position.x ||
      nextProps.position.y !== this.state.position.y
    ) {
      this.setState({
        position: nextProps.position
      });
    }
    if (nextProps.isVisible !== this.state.isVisible) {
      this.setState({
        isVisible: nextProps.isVisible
      });
      this.manageMenuItemsStatus();
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  async manageMenuItemsStatus() {
    let _menuItems = [...this.state.menuItems];

    // Cut
    let cut = this.state.menuItems.find(
      (x) => x.itemType === ContextMenuItemsType.Cut
    );
    let cutIndex = this.state.menuItems.findIndex(
      (x) => x.itemType === ContextMenuItemsType.Cut
    );

    // Copy
    let copy = this.state.menuItems.find(
      (x) => x.itemType === ContextMenuItemsType.Copy
    );
    let copyIndex = this.state.menuItems.findIndex(
      (x) => x.itemType === ContextMenuItemsType.Copy
    );

    // Delete
    let deleteItem = this.state.menuItems.find(
      (x) => x.itemType === ContextMenuItemsType.Delete
    );
    let deleteItemIndex = this.state.menuItems.findIndex(
      (x) => x.itemType === ContextMenuItemsType.Delete
    );
    if (window.getSelection().toString().length > 0) {
      if (cut) {
        _menuItems[cutIndex].isDisabled = false;
        this.setState({ menuItems: _menuItems });
      }

      if (copy) {
        _menuItems[copyIndex].isDisabled = false;
        this.setState({ menuItems: _menuItems });
      }

      if (deleteItem) {
        _menuItems[deleteItemIndex].isDisabled = false;
        this.setState({ menuItems: _menuItems });
      }
    } else {
      if (cut) {
        _menuItems[cutIndex].isDisabled = true;
        this.setState({ menuItems: _menuItems });
      }

      if (copy) {
        _menuItems[copyIndex].isDisabled = true;
        this.setState({ menuItems: _menuItems });
      }

      if (deleteItem) {
        _menuItems[deleteItemIndex].isDisabled = true;
        this.setState({ menuItems: _menuItems });
      }
    }

    // Paste
    let paste = this.state.menuItems.find(
      (x) => x.itemType === ContextMenuItemsType.Paste
    );
    let pasteIndex = this.state.menuItems.findIndex(
      (x) => x.itemType === ContextMenuItemsType.Paste
    );

    // Paste & Go
    let pasteGo = this.state.menuItems.find(
      (x) => x.itemType === ContextMenuItemsType.PasteAndGo
    );
    let pasteGoIndex = this.state.menuItems.findIndex(
      (x) => x.itemType === ContextMenuItemsType.PasteAndGo
    );
    if (
      this.props.onActionInvoked &&
      (await this.props.onActionInvoked('readClipboard'))
    ) {
      if (paste) {
        _menuItems[pasteIndex].isDisabled = false;
        this.setState({ menuItems: _menuItems });
      }

      if (pasteGo) {
        _menuItems[pasteGoIndex].isDisabled = false;
        this.setState({ menuItems: _menuItems });
      }
    } else {
      if (paste) {
        _menuItems[pasteIndex].isDisabled = true;
        this.setState({ menuItems: _menuItems });
      }

      if (pasteGo) {
        _menuItems[pasteGoIndex].isDisabled = true;
        this.setState({ menuItems: _menuItems });
      }
    }
  }

  public render() {
    const className = ['contextMenu'];
    if (!this.state.isVisible) className.push('hidden');

    const menuStyle = {
      left: this.state.position.x,
      top: this.state.position.y
    };

    return (
      <ul className={className.join(' ')} style={menuStyle} ref={this.setRef}>
        {this.state.menuItems.map((item, index) => {
          return <ContextMenuItem {...item} key={index} />;
        })}
      </ul>
    );
  }

  private setRef(node: HTMLUListElement) {
    this.ref = node;
  }

  private handleClickOutside(e: MouseEvent) {
    if (this.ref && !this.ref.contains(e.target as Node)) {
      this.props.setVisibility(false);
    }
  }

  private async CutHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.onActionInvoked && this.props.selectedUrlInput) {
      await this.props.onActionInvoked('writeClipboard', {
        value: this.props.selectedUrlInput
      });
      this.props.setUrl('');
    }
  }

  private async CopyHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.onActionInvoked && this.props.selectedUrlInput) {
      await this.props.onActionInvoked('writeClipboard', {
        value: this.props.selectedUrlInput
      });
    }
  }

  private async PasteHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.onActionInvoked) {
      let value: string = await this.props.onActionInvoked('readClipboard');
      if (value) this.props.setUrl(value);
    }
  }

  private async PasteGoHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.onActionInvoked && this.props.enterUrl) {
      let value: string = await this.props.onActionInvoked('readClipboard');
      if (value) {
        this.props.setUrl(value);
        this.props.enterUrl();
      }
    }
  }

  private async DeleteHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.selectedUrlInput) {
      this.props.setUrl('');
    }
  }

  private async SelectAllHandler(event: React.MouseEvent<HTMLLIElement>) {
    if (this.props.selectUrl) {
      this.props.selectUrl();
    }
  }
}

export default ContextMenu;
