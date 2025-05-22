# VS Code

It is recommended to use VS Code for development. You can download and install VSCode from the [official website](https://code.visualstudio.com/Download).

> [!NOTE]
> You can also use other IDEs like [Cursor](https://www.cursor.com/), [Windsurf](https://windsurf.com/), [void](https://voideditor.com/), or other IDEs that are a fork of VS Code.

There is a `.vscode` directory in the root of the project that contains several files that are used to configure the development environment.

## Settings (`.vscode/settings.json`)

You can define your editor settings in the `.vscode/settings.json` file. These will override the default settings. Here is an example of the settings provided in the repository:

```json
{
  "workbench.preferredDarkColorTheme": "Default Dark+", // Set the default dark theme
  "workbench.preferredLightColorTheme": "Visual Studio Dark", // Set the default light theme
  "workbench.colorTheme": "Default Light+", // Set the default theme
  "window.autoDetectColorScheme": true, // Automatically detect the color scheme
  "window.zoomLevel": 0, // Set the default zoom level
  "editor.fontSize": 18, // Set the default font size
  "editor.lineHeight": 1.8, // Set the default line height
  "editor.fontFamily": "MonoLisa", // Set the default font family
  "terminal.integrated.fontSize": 18, // Set the default terminal font size
  "terminal.integrated.lineHeight": 1.8, // Set the default terminal line height
  "terminal.integrated.fontFamily": "MonoLisa", // Set the default terminal font family
  "editor.minimap.enabled": false, // Disable the minimap
  "editor.tabSize": 2, // Set the default tab size
  "editor.wordWrap": "off", // Enable word wrap
  "editor.mouseWheelZoom": true, // Enable mouse wheel zoom
  "editor.formatOnSave": true, // Format the code on save
  "editor.defaultFormatter": "esbenp.prettier-vscode", // Set the default formatter
  "typescript.tsdk": "node_modules/typescript/lib" // Set the TypeScript SDK
}
```

## Extensions (`.vscode/extensions.json`)

You can define a set of recommended extensions in the `.vscode/extensions.json` file. When you open the project in VS Code, it will prompt you to install the recommended extensions if you don't have them installed yet. Here is an example of the extensions provided in the repository:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "ms-vscode.js-debug-nightly",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.vscode-remote-extensionpack"
  ]
}
```

Make note of the `vscode-remote-extensionpack` extension. This extension is used to open the project in a development container. Refer to the [README](../README.md) for more information on how to locally develop and debug the application while using the development container.

## Debugging (`.vscode/launch.json`)

You can define a set of debugging configurations in the `.vscode/launch.json` file. Here is an example of the configurations provided in the repository:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TypeScript Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        // Node.js internal core modules
        "<node_internals>/**",
        // Ignore all dependencies (optional)
        "${workspaceFolder}/node_modules/**"
      ],
      "sourceMaps": true,
      "smartStep": true
    }
  ]
}
```

Let's break down the configuration:

- `"name"`: This property defines a name for the configuration which will appear in the dropdown menu of the Debug pane.
- `"type"`: This property specifies the type of debugger to use. For Node.js, the type is `"node"`.
- `"request"`: This property specifies the request type. `"launch"` means the debugger should launch the program.
- `"runtimeExecutable"`: This property specifies an absolute path to the runtime executable to be used. Here, we use `"pnpm"` assuming it is available in your PATH.
- `"runtimeArgs"`: This property specifies an array of command-line arguments passed to the runtime executable. Here, we run the `"dev"` pnpm script.
- `"console"`: This property determines where to display the debug output. `"integratedTerminal"` means the output will display in VSCode's terminal.
- `"internalConsoleOptions"`: This property controls whether the internal debug console should automatically open when a session starts. I like to disable this because I prefer to use the integrated terminal.
- `"skipFiles"`: This property specifies an array of file or folder names, or glob patterns, to skip when debugging. Here, we skip anything in the `<node_internals>` (internal Node.js modules) and `node_modules` directories (third-party packages).
- `"sourceMaps"`: This property specifies whether the debugger should use JavaScript source maps (`.map` files) during debugging. Source maps are information files that map the generated JavaScript code back to the original TypeScript code. This is helpful when debugging the built code. In our case, it won't make a difference because we are not building the app but it's a good practice to include it.
- `"smartStep"`: This property specifies whether the debugger should automatically step through generated code that cannot be mapped back to the original source. Similar to the `"sourceMaps"` property, it won't make a difference in our case but it's a good practice to include it.

### How to use the debugger

With the launch configuration in place, you are now ready to debug your TypeScript application in VSCode:

1. **Set Breakpoints**: Open any of the `.ts` files and set breakpoints by clicking on the left margin of the code lines.

2. **Start Debugging**: Open the Debug panel in VSCode, select "Debug TypeScript Server" from the dropdown, and click the green play button or press `F5` to start debugging.

VSCode will execute your TypeScript server in debug mode, pausing at any breakpoints you've set, allowing you to step through your code, inspect variables, and utilize various debugging tools.
