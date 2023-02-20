# @salesforce/sfdx-plugin-lwc-test

Tools for unit testing Lightning web components in a Salesforce DX workspace

## Usage

Install as a plugin in the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). While this plugin is in pilot you will need to manually install the plugin into your CLI.

```sh-session
$ sfdx plugins:install @salesforce/sfdx-plugin-lwc-test
$ sfdx force:lightning:lwc:test --help
```

## Commands

<!-- commands -->

- [`sfdx force:lightning:lwc:test:create`](#sfdx-forcelightninglwctestcreate)
- [`sfdx force:lightning:lwc:test:run [PASSTHROUGH]`](#sfdx-forcelightninglwctestrun-passthrough)
- [`sfdx force:lightning:lwc:test:setup`](#sfdx-forcelightninglwctestsetup)

## `sfdx force:lightning:lwc:test:create`

creates a Lightning web component test file with boilerplate code inside a **tests** directory.

```
USAGE
  $ sfdx force:lightning:lwc:test:create -f <value> [--json]

FLAGS
  -f, --filepath=<value>  (required) path to Lightning web component .js file to create a test for

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  creates a Lightning web component test file with boilerplate code inside a **tests** directory.

  Creates a **tests** directory in the specified directory. Creates a yourComponentName.test.js file with boilerplate
  code in the **tests** directory.

EXAMPLES
  $ sfdx force:lightning:lwc:test:create -f force-app/main/default/lwc/myButton/myButton.js

FLAG DESCRIPTIONS
  -f, --filepath=<value>  path to Lightning web component .js file to create a test for

    Path to Lightning web component .js file to create a test for.
```

_See code: [src/commands/force/lightning/lwc/test/create.ts](https://github.com/salesforce/sfdx-plugin-lwc-test/blob/v1.0.1/src/commands/force/lightning/lwc/test/create.ts)_

## `sfdx force:lightning:lwc:test:run [PASSTHROUGH]`

invokes Lightning Web Components Jest unit tests.

```
USAGE
  $ sfdx force:lightning:lwc:test:run [PASSTHROUGH] [--json] [-d | --watch]

ARGUMENTS
  PASSTHROUGH  passthrough arg

FLAGS
  -d, --debug  run tests in debug mode
  --watch      run tests in watch mode

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  invokes Lightning Web Components Jest unit tests.

  Invokes Lightning Web Components Jest unit tests.

EXAMPLES
  $ sfdx force:lightning:lwc:test:run

  $ sfdx force:lightning:lwc:test:run -w

FLAG DESCRIPTIONS
  -d, --debug  run tests in debug mode

    Runs tests in a Node process that an external debugger can connect to. The run pauses until the debugger is
    connected. For more information, see: https://jestjs.io/docs/en/troubleshooting

  --watch  run tests in watch mode

    Runs tests when a watched file changes. Watched files include the component under test and any files it references.
```

_See code: [src/commands/force/lightning/lwc/test/run.ts](https://github.com/salesforce/sfdx-plugin-lwc-test/blob/v1.0.1/src/commands/force/lightning/lwc/test/run.ts)_

## `sfdx force:lightning:lwc:test:setup`

install Jest unit testing tools for Lightning Web Components.

```
USAGE
  $ sfdx force:lightning:lwc:test:setup [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  install Jest unit testing tools for Lightning Web Components.

  install Jest unit testing tools for Lightning Web Components.

EXAMPLES
  $ sfdx force:lightning:lwc:test:setup
```

_See code: [src/commands/force/lightning/lwc/test/setup.ts](https://github.com/salesforce/sfdx-plugin-lwc-test/blob/v1.0.1/src/commands/force/lightning/lwc/test/setup.ts)_

<!-- commandsstop -->
