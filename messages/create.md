# example

$ <%= config.bin %> <%= command.id %> -f force-app/main/default/lwc/myButton/myButton.js

# commandDescription

creates a Lightning web component test file with boilerplate code inside a **tests** directory.

# longDescription

Creates a **tests** directory in the specified directory. Creates a yourComponentName.test.js file with boilerplate code in the **tests** directory.

# filepathFlagDescription

path to Lightning web component .js file to create a test for

# filepathFlagLongDescription

Path to Lightning web component .js file to create a test for.

# errorFileNotFound

File not found: '%s'.

# errorFileNotJs

File must be a JavaScript file. The '.js' extension was not found: '%s'.

# errorFileExists

Test file already exists: '%s'.

# logSuccess

Test case successfully created: %s
