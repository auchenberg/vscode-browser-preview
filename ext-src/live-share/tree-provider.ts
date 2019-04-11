import {
  Command,
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState
} from 'vscode';
import { LiveShare, View, Role } from 'vsls/vscode';
import * as path from 'path';
import { BrowserViewWindowManager } from '../BrowserViewWindowManager';

enum Items {
  Root,
  Browsers,
  ShareBrowser,
  NoSharedBrowsers
}

class BroswerTreeDataProvider implements TreeDataProvider<TreeItem> {
  constructor(
    private extensionPath: string,
    private vslsApi: LiveShare,
    private windowManager: BrowserViewWindowManager
  ) {
    windowManager.on('windowCreated', (id: string) => {
      const window = windowManager.getById(id);
      if (!window) {
        return;
      }

      window.on('stateChanged', this.refresh);
      this.refreshBrowsers();
    });

    windowManager.on('windowDisposed', (id: string) => {
      this.refreshBrowsers();
    });
  }

  private _onDidChangeTreeData = new EventEmitter<TreeItem>();
  public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

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
    return this.getShareBrowsersTreeItem();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  private getRootTreeItem() {
    const label = `Shared Browsers (${this.windowManager.openWindows.size})`;
    const treeItem = new TreeItem(label);
    treeItem.collapsibleState = TreeItemCollapsibleState.Expanded;
    return treeItem;
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

  private getShareBrowsersTreeItem() {
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

  private refreshBrowsers() {
    this.refresh();
  }
}

export default function(extensionPath: string, vslsApi: LiveShare, windowManager: BrowserViewWindowManager) {
  const treeDataProvider = new BroswerTreeDataProvider(extensionPath, vslsApi, windowManager);
  vslsApi.registerTreeDataProvider(View.Session, treeDataProvider);
  vslsApi.registerTreeDataProvider(View.ExplorerSession, treeDataProvider);
}
