# examples

- $ <%= config.bin %> <%= command.id %>

- $ <%= config.bin %> <%= command.id %> -w

# commandDescription

invokes Lightning Web Components Jest unit tests.

# longDescription

Invokes Lightning Web Components Jest unit tests.

# debugFlagDescription

run tests in debug mode

# debugFlagLongDescription

Runs tests in a Node process that an external debugger can connect to. The run pauses until the debugger is connected. For more information, see: https://jestjs.io/docs/en/troubleshooting

# watchFlagDescription

run tests in watch mode

# watchFlagLongDescription

Runs tests when a watched file changes. Watched files include the component under test and any files it references.

# errorNoExecutableFound

No sfdx-lwc-jest executable found. Verify it is properly installed.
Run "%s lightning:setup:lwc:test --help" for installation details.

# logSuccess

Test run complete. Exited with status code: %s
