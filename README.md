<h1 align="center">
  <br>
    <img src="https://github.com/auchenberg/vscode-browser-preview/blob/master/resources/icon_128.png?raw=true" alt="logo" width="100">
  <br>
  Browser Preview for VS Code
  <br>
  <br>
</h1>

<h4 align="center">Open a real browser preview inside VS Code (Powered by Chrome Headless)</h4>

Browser Preview for VS Code enables you to open a real browser preview inside VS Code. The browser preview is powered by Chrome Headless, where VS Code controls the headless browser instance and streams the rendered content back to VS Code. 

This enables a secure way to render web content inside VS Code, and opens the door for many interesting debugging oppertunities, as the browser preview is a real browser, and not just a WebView or iFrame.


![](resources/demo.gif)

## Getting started

1. Grab extension from marketplace
2. Click the new "Browser Preview" button in the activity bar.

Make sure you have Google Chrome installed on your computer.

## Features
- Browser preview inside VS Code (Powered by Chrome Headless).
- Ability to have multiple previews open at the same time.
- Debuggable. Attach [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) to the browser view instance, and debug within VS Code.
- Attach Chrome DevTools via `chrome://inspect`
- Option to set the default startUrl via `browserpreview.startUrl`

## Debugging

You can configure VS Code's debugger to either attach or launch to the browser previews by using the following configuration:

```json
{
    "version": "0.1.0",
    "configurations": [
        {
            "type": "browser-preview",
            "request": "launch",
            "name": "Launch Browser Preview",
            "url": "http://code.visualstudio.com"
        },
        {
            "type": "browser-preview",
            "request": "attach",
            "name": "Attach Browser Preview"
        }
    ]
}
```

## Additional configuration.

Browser Preview has the following settings:

```json
"browserpreview.startUrl": // The default start url for new Browser Preview instances
```
