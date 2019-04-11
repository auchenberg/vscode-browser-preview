import * as vscode from 'vscode';

import TargetTreeProvider from './targetTreeProvider';
import DebugProvider from './debugProvider';
import { BrowserViewWindowManager } from './BrowserViewWindowManager';
import { setupLiveShare } from './live-share';

export function activate(context: vscode.ExtensionContext) {
  const windowManager = new BrowserViewWindowManager(context.extensionPath);
  const debugProvider = new DebugProvider(windowManager);

  vscode.window.registerTreeDataProvider('targetTree', new TargetTreeProvider());
  vscode.debug.registerDebugConfigurationProvider('browser-preview', debugProvider.getProvider());

  context.subscriptions.push(
    vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
      windowManager.create(url);
    }),

    vscode.commands.registerCommand('browser-preview.openActiveFile', () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        return; // no active editor: ignore the command
      }

      // get active url
      const filename = activeEditor.document.fileName;

      if (filename) {
        windowManager.create(`file://${filename}`);
      }
    })
  );

  setupLiveShare(context.extensionPath, windowManager);
}
