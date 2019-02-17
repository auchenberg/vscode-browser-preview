import * as vscode from 'vscode';

export default class TargetTreeProvider implements vscode.TreeDataProvider<object> {
  private _onDidChangeTreeData: vscode.EventEmitter<object | undefined> = new vscode.EventEmitter<object | undefined>();
  readonly onDidChangeTreeData: vscode.Event<object | undefined> = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: object): vscode.TreeItem {
    return element;
  }

  getChildren(element?: object): Thenable<object[]> {
    vscode.commands.executeCommand('browser-preview.openPreview');
    vscode.commands.executeCommand('workbench.view.explorer');

    this._onDidChangeTreeData.fire(); // Make sure collection is not cached.
    return Promise.reject([]);
  }
}
