import * as vscode from 'vscode';

import TargetTreeProvider from './targetTreeProvider';
import DebugProvider from './debugProvider';
import { BrowserViewWindowManager } from './BrowserViewWindowManager';

export function activate(context: vscode.ExtensionContext) {
  const windowManager = new BrowserViewWindowManager(context.extensionPath);
  const debugProvider = new DebugProvider(windowManager);

  vscode.window.registerTreeDataProvider('targetTree', new TargetTreeProvider());
  vscode.debug.registerDebugConfigurationProvider('browser-preview', debugProvider.getProvider());

  context.subscriptions.push(
    vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
      windowManager.create(url);
    }),
    vscode.commands.registerCommand('browser-preview.openPreviewToSide', (url?) => {
      windowManager.create(url);
    })
  );

  let myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  myStatusBarItem.text = 'Open Browser Preview';
  myStatusBarItem.tooltip = 'Open new Browser Preview';
  myStatusBarItem.command = 'browser-preview.openPreview';
  myStatusBarItem.show();
  context.subscriptions.push(myStatusBarItem);
}
