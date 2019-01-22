<h1 align="center">
  <br>
    <img src="https://github.com/auchenberg/vscode-browser-preview/blob/master/resources/icon_128.png?raw=true" alt="logo" width="100">
  <br>
  Browser Preview for VS Code
  <br>
  <br>
</h1>

<h4 align="center">A real browser preview inside your editor that you can debug.</h4>

Browser Preview for VS Code enables you to open a real browser preview inside your editor that you can debug. Browser Preview is powered by Chrome Headless, and works by starting a headless Chrome instance in a new process. This enables a secure way to render web content inside VS Code, and enables interesting features such as as in-editor debugging and more!

![](resources/demo.gif)

## Getting started

1. Grab extension from [marketplace](https://marketplace.visualstudio.com/items?itemName=auchenberg.vscode-browser-preview)
2. Click the new "Browser Preview" button in the Side Bar to the left or run the command `Browser View: Open Preview`

Make sure you have Google Chrome installed on your computer.

## Features
- Browser preview inside VS Code (Powered by Chrome Headless).
- Ability to have multiple previews open at the same time.
- Debuggable. Launch urls and attach [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) to the browser view instance, and debug within VS Code.
- Attach Chrome DevTools via `chrome://inspect`
- Option to set the default startUrl via `browser-preview.startUrl`

## Launch and Debugging

You can enable in-editor debugging of Browser Previews by installing [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome), and configure VS Code's debugger to either attach or launch to the browser previews by using the following configuration:

```json
{
    "version": "0.1.0",
    "configurations": [
        {
            "type": "browser-preview",
            "request": "attach",
            "name": "Browser Preview: Attach"
        },    
        {
            "type": "browser-preview",
            "request": "launch",
            "name": "Browser Preview: Launch",
            "url": "http://localhost:3000"
        }
    ]
}
```

The debug configuration also supports these additional properties: `webRoot`, `pathMapping`, `trace`, `sourceMapPathOverrides` and `urlFilter`. See https://github.com/Microsoft/vscode-chrome-debug#other-optional-launch-config-fields for details on how to use.

## Additional configuration.

Browser Preview has the following settings:

```json
"browser-preview.startUrl": // The default start url for new Browser Preview instances
```
