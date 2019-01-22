import * as path from 'path';
import * as vscode from 'vscode';

import Browser from './browser'
import BrowserPage from './browserPage';
import TargetTreeProvider from './targetTreeProvider';
import * as EventEmitter from 'eventemitter2';

export function activate(context: vscode.ExtensionContext) {

	const windowManager = new BrowserViewWindowManager();
	vscode.window.registerTreeDataProvider('targetTree', new TargetTreeProvider());

	context.subscriptions.push(vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
		windowManager.create(context.extensionPath, url);
	}));

    vscode.debug.registerDebugConfigurationProvider('browser-preview', {
        provideDebugConfigurations(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration[]> {
            return Promise.resolve([
				{
					type: 'browser-preview',
					name: 'Browser Preview: Attach',
					request: 'attach'
				},
				{
					type: `browser-preview`,
					request: `launch`,
					name: `Browser Preview: Launch`,
					url: `http://localhost:3000`
				}				
			]);
		},
		
        resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
			let debugConfig = {
				name: `Browser Preview`,
				type: `chrome`,
				request: 'attach',
				port: 9222,
				webRoot: config.webRoot,
				pathMapping: config.pathMapping,
				trace: config.trace,
				sourceMapPathOverrides: config.sourceMapPathOverrides,
				urlFilter: '',
				url: '',
			};

			if (config && config.type === 'browser-preview') {
                if (config.request && config.request.localeCompare('attach', 'en', { sensitivity: 'base' }) === 0) {
					debugConfig.name = `Browser Preview: Attach`;
					vscode.debug.startDebugging(folder, debugConfig)
				} else if (config.request && config.request.localeCompare('launch', 'en', { sensitivity: 'base' }) === 0) {
					debugConfig.name = `Browser Preview: Launch`;
					debugConfig.urlFilter = config.url;
					
					// Launch new preview tab, set url filter, then attach
					var launch = vscode.commands.executeCommand(`browser-preview.openPreview`, config.url)
					launch.then(() => {
						vscode.debug.startDebugging(folder, debugConfig)
					});
				}
				
            } else {
                vscode.window.showErrorMessage('No supported launch config was found.');
            }
            return;
        }
	});


	vscode.debug.onDidTerminateDebugSession((e: vscode.DebugSession) => {
		if(e.name === `Browser Preview: Launch` && e.configuration.urlFilter) {
			// TODO: Improve this with some unique ID per browser window instead of url, to avoid closing multiple instances
			windowManager.disposeByUrl(e.configuration.urlFilter)
		}
	});
		
}

class BrowserViewWindowManager {

	private openWindows: Set<BrowserViewWindow>;
	private browser: any;

	constructor() {
		this.openWindows = new Set();
	}
	
	public create(extensionPath: string, startUrl?: string) {

		if(!this.browser) {
			this.browser = new Browser();
		}

		let window = new BrowserViewWindow(extensionPath, this.browser);
		window.launch(startUrl);
		window.once('disposed', () => {
			this.openWindows.delete(window);

			if(this.openWindows.size === 0) {
				this.browser.dispose();
				this.browser = null;
			}
		});
		this.openWindows.add(window);
	}

	public disposeByUrl(url: string) {
		this.openWindows.forEach((b: BrowserViewWindow) => {
			if(b.config.settings.startUrl == url) {
				b.dispose();
			}
		})
	}

}

class BrowserViewWindow extends EventEmitter.EventEmitter2 {

	private static readonly viewType = 'browser-preview';

	private _panel: vscode.WebviewPanel | null;
	private _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	
	private browserPage: BrowserPage | null;
	private browser: Browser;
	public config: any;
	
	constructor(extensionPath: string, browser: Browser) {
		super();
		this._extensionPath = extensionPath;
		this._panel = null;
		this.browserPage = null;
		this.browser = browser;
	}

	public async launch(startUrl?: string) {

		try {
			this.browserPage = await this.browser.newPage();
			if(this.browserPage) {
				this.browserPage.else((data: any) => {
					if(this._panel) {
						this._panel.webview.postMessage(data) 
					}
				})
			}
		} catch (err) {
			vscode.window.showErrorMessage(err.message)
		}		

		let column = vscode.ViewColumn.Two;

		this._panel = vscode.window.createWebviewPanel(BrowserViewWindow.viewType, "Browser Preview", column, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(this._extensionPath, 'build'))
			]
		});
		
		this._panel.webview.html = this._getHtmlForWebview();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(message => {

			if(message.type === 'extension.updateTitle') {
				if(this._panel) {
					this._panel.title = message.params.title
					return;
				}
			}

			if(this.browserPage){
				try {
					this.browserPage.send(message.type, message.params, message.callbackId);
				} 
				catch(err) {
					vscode.window.showErrorMessage(err)
				}
			}
		}, null, this._disposables);	
		
		// App Settings
		let extensionSettings = vscode.workspace.getConfiguration('browser-preview');
		let appSettings = {
			startUrl: startUrl ? startUrl : extensionSettings.get('startUrl')
		};

		if(!appSettings.startUrl) { // Fallback url
			appSettings.startUrl = 'http://code.visualstudio.com';
		}

		this.config = {
			settings: appSettings
		}

		this._panel.webview.postMessage({
			method: 'extension.appConfiguration',
			result: this.config
		}) 	
	}

	public dispose() {
		if(this._panel) {
			this._panel.dispose();
		}

		if(this.browserPage) {
			this.browserPage.dispose();
			this.browserPage = null;
		}

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}

		this.emit('disposed');
	}

	private _getHtmlForWebview() {
		const manifest = require(path.join(this._extensionPath, 'build', 'asset-manifest.json'));
		const mainScript = manifest['main.js'];
		const mainStyle = manifest['main.css'];
		const runtimeScript = manifest['runtime~main.js'];
		const chunkScript = manifest['static/js/1.0e8ab1f0.chunk.js'];

		const runtimescriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', runtimeScript));
		const runtimescriptUri = runtimescriptPathOnDisk.with({ scheme: 'vscode-resource' });
		const chunkScriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', chunkScript));
		const chunkScriptUri = chunkScriptPathOnDisk.with({ scheme: 'vscode-resource' });
		const mainScriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainScript));
		const mainScriptUri = mainScriptPathOnDisk.with({ scheme: 'vscode-resource' });

		const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainStyle));
		const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<base href="${vscode.Uri.file(path.join(this._extensionPath, 'build')).with({ scheme: 'vscode-resource' })}/">
			</head>

			<body>
				<div id="root"></div>
				<script src="${runtimescriptUri}"></script>
				<script src="${chunkScriptUri}"></script>
				<script src="${mainScriptUri}"></script>
			</body>
			</html>`;
	}
}
