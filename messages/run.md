# examples

- Run LWC Jest unit tests:

  $ <%= config.bin %> <%= command.id %>

- Run LWC Jest unit tests only when a watched file changes:

  $ <%= config.bin %> <%= command.id %> --watch

# summary

Invoke Lightning Web Components Jest unit tests.

# flags.debug.summary

Run tests in a Node process that an external debugger can connect to.

# flags.debug.description

The run pauses until the debugger is connected. For more information, see: https://jestjs.io/docs/en/troubleshooting.

# flags.watch.summary

Run tests when a watched file changes.

# flags.watch.description

Watched files include the component under test and any files it references.

# errorNoExecutableFound

No sfdx-lwc-jest executable found. Verify it's properly installed.
Run "%s lightning setup lwc test --help" for installation details.

# logSuccess

Test run complete. Exited with status code: %s.
