export interface IContextMenu {
  menuItems: Array<IContextMenuItemProps>;
  isVisible: boolean;
  position: IPosition;
}

export interface IContextMenuProps extends IContextMenu {
  setVisibility: (value: boolean) => void;
  setUrl: (value: string) => void;
  enterUrl: () => void;
  selectUrl: (element?: HTMLInputElement) => void;
  onActionInvoked: (action: string, data?: object) => Promise<any>;
  selectedUrlInput: string;
}

export interface IContextMenuItemState {
  itemType: ContextMenuItemsType;
  isDisabled?: boolean;
}

export interface IContextMenuItemProps extends IContextMenuItemState {
  handleClick: (event: React.MouseEvent<HTMLLIElement>) => void;
  setVisibility: (value: boolean) => void;
}

export enum ContextMenuItemsType {
  Cut = 'Cut',
  Copy = 'Copy',
  Paste = 'Paste',
  PasteAndGo = 'Paste & Go',
  Delete = 'Delete',
  SelectAll = 'Select All',
  Seperator = '-'
}

export interface IPosition {
  x: number;
  y: number;
}
