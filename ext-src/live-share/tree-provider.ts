import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LiveShare, View, Role } from 'vsls/vscode';
import { BrowserViewWindow } from '../BrowserViewWindow';
import { BrowserViewWindowManager } from '../BrowserViewWindowManager';
import * as path from 'path';

class BroswerTreeDataProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new EventEmitter<TreeItem>();
  public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

  constructor(
    private extensionPath: string,
    private vslsApi: LiveShare,
    private windowManager: BrowserViewWindowManager
  ) {
    windowManager.openWindows.forEach((window) => {
      window.on('stateChanged', this.refreshWhenUrlChanges(window));
    });

    windowManager.on('windowCreated', (id: string) => {
      const window = windowManager.getById(id);
      if (!window) {
        return;
      }

      window.on('stateChanged', this.refreshWhenUrlChanges(window));
      this.refresh();
    });

    windowManager.on('windowDisposed', this.refresh);
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (!element) {
      return [this.getRootTreeItem()];
    }

    if (this.windowManager.openWindows.size === 0) {
      if (this.vslsApi.session.role === Role.Host) {
        return [this.getShareBrowserTreeItem()];
      } else {
        return [this.getNoSharedBrowserTreeItem()];
      }
    }

    return this.getSharedBrowserTreeItems();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  private getRootTreeItem() {
    const label = `Shared Browsers (${this.windowManager.openWindows.size})`;
    return new TreeItem(label, TreeItemCollapsibleState.Expanded);
  }

  private getShareBrowserTreeItem() {
    const treeItem = new TreeItem('Share browser...');
    treeItem.command = {
      title: 'Share browser...',
      command: 'browser-preview.openPreview'
    };
    return treeItem;
  }

  private getNoSharedBrowserTreeItem() {
    return new TreeItem('No browsers shared');
  }
  private getSharedBrowserTreeItems() {
    const result = [...this.windowManager.openWindows];

    return result.map((item) => {
      const { url } = <any>item.getState();
      const treeItem = new TreeItem(url);
      treeItem.command = {
        title: 'Open Shared Browser',
        command: 'browser-preview.openSharedBrowser',
        arguments: [item.id]
      };
      treeItem.iconPath = {
        dark: path.join(this.extensionPath, 'resources/icon_dark.svg'),
        light: path.join(this.extensionPath, 'resources/icon_light.svg')
      };

      return treeItem;
    });
  }

  private refresh = () => {
    this._onDidChangeTreeData.fire();
  };

  private refreshWhenUrlChanges = (window: BrowserViewWindow) => {
    let previousUrl = (<any>window.getState()).url;
    return () => {
      const { url } = <any>window.getState();
      if (previousUrl !== url) {
        previousUrl = url;
        this.refresh();
      }
    };
  };
}

export default function(extensionPath: string, vslsApi: LiveShare, windowManager: BrowserViewWindowManager) {
  const treeDataProvider = new BroswerTreeDataProvider(extensionPath, vslsApi, windowManager);
  vslsApi.registerTreeDataProvider(View.Session, treeDataProvider);
  vslsApi.registerTreeDataProvider(View.ExplorerSession, treeDataProvider);
}
