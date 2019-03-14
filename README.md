sfdx-lwc-test
=============

foo

[![Version](https://img.shields.io/npm/v/sfdx-lwc-test.svg)](https://npmjs.org/package/sfdx-lwc-test)
[![CircleCI](https://circleci.com/gh/trevor-bliss/sfdx-lwc-test/tree/master.svg?style=shield)](https://circleci.com/gh/trevor-bliss/sfdx-lwc-test/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/trevor-bliss/sfdx-lwc-test?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-lwc-test/branch/master)
[![Codecov](https://codecov.io/gh/trevor-bliss/sfdx-lwc-test/branch/master/graph/badge.svg)](https://codecov.io/gh/trevor-bliss/sfdx-lwc-test)
[![Greenkeeper](https://badges.greenkeeper.io/trevor-bliss/sfdx-lwc-test.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/trevor-bliss/sfdx-lwc-test/badge.svg)](https://snyk.io/test/github/trevor-bliss/sfdx-lwc-test)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-lwc-test.svg)](https://npmjs.org/package/sfdx-lwc-test)
[![License](https://img.shields.io/npm/l/sfdx-lwc-test.svg)](https://github.com/trevor-bliss/sfdx-lwc-test/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-lwc-test
$ sfdx-lwc-test COMMAND
running command...
$ sfdx-lwc-test (-v|--version|version)
sfdx-lwc-test/0.0.1 darwin-x64 node-v8.12.0
$ sfdx-lwc-test --help [COMMAND]
USAGE
  $ sfdx-lwc-test COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx-lwc-test lwc:test:create`](#sfdx-lwc-test-lwctestcreate)
* [`sfdx-lwc-test lwc:test:run [PASSTHROUGH]`](#sfdx-lwc-test-lwctestrun-passthrough)

## `sfdx-lwc-test lwc:test:create`

create a Lightning web component test with boilerplate code inside a __tests__ directory

```
USAGE
  $ sfdx-lwc-test lwc:test:create

OPTIONS
  -f, --filepath=filepath                         (required) path to Lightning web component js file to create test for
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx force:lightning:lwc:test:create -f force-app/main/default/lwc/myButton/myButton.js
```

_See code: [src/commands/lwc/test/create.ts](https://github.com/trevor-bliss/sfdx-lwc-test/blob/v0.0.1/src/commands/lwc/test/create.ts)_

## `sfdx-lwc-test lwc:test:run [PASSTHROUGH]`

invoke Lightning web component Jest unit tests

```
USAGE
  $ sfdx-lwc-test lwc:test:run [PASSTHROUGH]

OPTIONS
  -d, --debug                                     run tests in debug mode
  -w, --watch                                     run tests in watch mode
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx force:lightning:lwc:test:run
  $ sfdx force:lightning:lwc:test:run -w
```

_See code: [src/commands/lwc/test/run.ts](https://github.com/trevor-bliss/sfdx-lwc-test/blob/v0.0.1/src/commands/lwc/test/run.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
