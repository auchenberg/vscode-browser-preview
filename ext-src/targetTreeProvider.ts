import * as vscode from 'vscode';

export default class TargetTreeProvider implements vscode.TreeDataProvider<object> {
  private _onDidChangeTreeData: vscode.EventEmitter<object | undefined> = new vscode.EventEmitter<object | undefined>();
  readonly onDidChangeTreeData: vscode.Event<object | undefined> = this._onDidChangeTreeData.event;
  emptyTree: vscode.TreeItem;

  constructor() {
    this.emptyTree = new vscode.TreeItem('Browser Preview');
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(this.emptyTree);
  }

  getTreeItem(element: object): vscode.TreeItem {
    return element;
  }

  getChildren(element?: object): Thenable<object[]> {
    vscode.commands.executeCommand('browser-preview.openPreview');
    vscode.commands.executeCommand('workbench.view.explorer');

    this._onDidChangeTreeData.fire(this.emptyTree); // Make sure collection is not cached.
    return Promise.reject([]);
  }
}
