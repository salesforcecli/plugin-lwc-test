@salesforce/plugin-lwc-test
=============

:warning: Note that this plugin is still in active development. Functionality is subject to change. For questions or feedback reach out to Trevor Bliss. :warning:

Tools for unit testing Lightning web components in a Salesforce DX workspace

# Usage

Install as a plugin in the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). While this plugin is in pilot you will need to point the `SFDX_NPM_REGISTRY` to the internal npm registry.
```sh-session
$ SFDX_NPM_REGISTRY=http://platform-cli-registry.eng.sfdc.net:4880/ sfdx plugins:install @salesforce/plugin-lwc-test 
$ sfdx force:lightning:lwc --help
```

Or, clone this repository and use the run script.
```sh-session
$ git clone git@git.soma.salesforce.com:tbliss/plugin-lwc-test.git
$ cd plugin-lwc-test
$ yarn
$ ./bin/run force:lightning:lwc --help
```
<!-- commands -->
- [@salesforce/plugin-lwc-test](#salesforceplugin-lwc-test)
- [Usage](#usage)
  - [`sfdx force:lightning:lwc:test:create -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal]`](#sfdx-forcelightninglwctestcreate--f-string---json---loglevel-tracedebuginfowarnerrorfatal)
  - [`sfdx force:lightning:lwc:test:run [-d] [--watch] [--json] [--loglevel trace|debug|info|warn|error|fatal]`](#sfdx-forcelightninglwctestrun--d---watch---json---loglevel-tracedebuginfowarnerrorfatal)
  - [`sfdx force:lightning:lwc:test:setup [--json] [--loglevel trace|debug|info|warn|error|fatal]`](#sfdx-forcelightninglwctestsetup---json---loglevel-tracedebuginfowarnerrorfatal)

## `sfdx force:lightning:lwc:test:create -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal]`

create a Lightning web component test with boilerplate code inside a __tests__ directory

```
USAGE
  $ sfdx force:lightning:lwc:test:create -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal]

OPTIONS
  -f, --filepath=filepath                         (required) path to Lightning web component .js file to create a test
                                                  for

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  [default: warn] logging level for this command invocation

EXAMPLE
  $ sfdx force:lightning:lwc:test:create -f force-app/main/default/lwc/myButton/myButton.js
```

_See code: [src/commands/force/lightning/lwc/test/create.ts](https://github.com/trevor-bliss/sfdx-lwc-test/blob/v0.0.6/src/commands/force/lightning/lwc/test/create.ts)_

## `sfdx force:lightning:lwc:test:run [-d] [--watch] [--json] [--loglevel trace|debug|info|warn|error|fatal]`

invoke Lightning web component Jest unit tests

```
USAGE
  $ sfdx force:lightning:lwc:test:run [-d] [--watch] [--json] [--loglevel trace|debug|info|warn|error|fatal]

OPTIONS
  -d, --debug                                     run tests in debug mode
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  [default: warn] logging level for this command invocation
  --watch                                         run tests in watch mode

EXAMPLES
  $ sfdx force:lightning:lwc:test:run
  $ sfdx force:lightning:lwc:test:run -w
```

_See code: [src/commands/force/lightning/lwc/test/run.ts](https://github.com/trevor-bliss/sfdx-lwc-test/blob/v0.0.6/src/commands/force/lightning/lwc/test/run.ts)_

## `sfdx force:lightning:lwc:test:setup [--json] [--loglevel trace|debug|info|warn|error|fatal]`

install Jest unit testing tools for Lightning web components

```
USAGE
  $ sfdx force:lightning:lwc:test:setup [--json] [--loglevel trace|debug|info|warn|error|fatal]

OPTIONS
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  [default: warn] logging level for this command invocation

EXAMPLE
  $ sfdx force:lightning:lwc:test:setup
```

_See code: [src/commands/force/lightning/lwc/test/setup.ts](https://github.com/trevor-bliss/sfdx-lwc-test/blob/v0.0.6/src/commands/force/lightning/lwc/test/setup.ts)_
