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

## Configuration.

Browser Preview has the following settings:

```json
"browserPreview.startUrl": // The default start url for new Browser Preview instances
```