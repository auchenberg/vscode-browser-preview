import { env } from 'vscode';
import * as path from 'path';
import * as vscode from 'vscode';

export default class ContentProvider {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  getContent() {
    const manifest = require(path.join(this.config.extensionPath, 'build', 'asset-manifest.json'));
    const mainScript = manifest['main.js'];
    const mainStyle = manifest['main.css'];
    const runtimeScript = manifest['runtime~main.js'];

    // finding potential list of js chunk files
    const chunkScriptsUri = [];
    for (let key in manifest) {
      if (key.endsWith('.chunk.js') && manifest.hasOwnProperty(key)) {
        // finding their paths on the disk
        let chunkScriptUri = vscode.Uri.file(path.join(this.config.extensionPath, 'build', manifest[key])).with({
          scheme: 'vscode-resource'
        });
        // push the chunk Uri to the list of chunks
        chunkScriptsUri.push(chunkScriptUri);
      }
    }

    const runtimescriptPathOnDisk = vscode.Uri.file(path.join(this.config.extensionPath, 'build', runtimeScript));
    const runtimescriptUri = runtimescriptPathOnDisk.with({
      scheme: 'vscode-resource'
    });
    const mainScriptPathOnDisk = vscode.Uri.file(path.join(this.config.extensionPath, 'build', mainScript));
    const mainScriptUri = mainScriptPathOnDisk.with({
      scheme: 'vscode-resource'
    });

    const stylePathOnDisk = vscode.Uri.file(path.join(this.config.extensionPath, 'build', mainStyle));
    const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <link rel="stylesheet" type="text/css" href="${styleUri}">
                    <base href="${vscode.Uri.file(path.join(this.config.extensionPath, 'build')).with({
                      scheme: 'vscode-resource'
                    })}/">
                </head>
    
                <body>
                    <div id="root"></div>
                    <script src="${runtimescriptUri}"></script>
                    ${chunkScriptsUri.map((item) => `<script src="${item}"></script>`)}
                    <script src="${mainScriptUri}"></script>
                </body>
                </html>`;
  }
}
