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

# flags.coverage.summary

Collect coverage and display in output.

# flags.coverage.description

Collect coverage and display in output.

# flags.updateSnapshot.summary

Re-record every snapshot that fails during a test run.

# flags.updateSnapshot.description

Re-record every snapshot that fails during a test run.

# flags.verbose.summary

Display individual test results with the test suite hierarchy.

# flags.verbose.description

Display individual test results with the test suite hierarchy.

# flags.skipApiVersionCheck.summary

Disable the "sourceApiVersion" field check before running tests.

# flags.skipApiVersionCheck.description

**Warning** By disabling this check you risk running tests against stale versions of the framework. See details here: https://github.com/salesforce/sfdx-lwc-jest#disabling-the-sourceApiVersion-check

# errorNoExecutableFound

No sfdx-lwc-jest executable found. Verify it's properly installed.
Run "%s lightning setup lwc test --help" for installation details.

# logSuccess

Test run complete. Jest exited with status code: %s%s.

# mustUseJsonFlag

In order to get jest json results, you must use the command --json flag.

# jestJsonFlagWarning

Requesting jest json results using "-- --json" is deprecated. Use "--json" instead.

# watchCannotBeUsedWithJsonFlag

Any of the jest "--watch" flags cannot be used with the "--json" flag.
