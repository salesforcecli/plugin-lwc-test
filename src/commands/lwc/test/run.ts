import { core, flags, SfdxCommand } from '@salesforce/command';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';


// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-lwc-test', 'run');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  // TODO(tbliss): update these examples to show example console output
  public static examples = [
  `$ sfdx force:lightning:lwc:test:run`,
  `$ sfdx force:lightning:lwc:test:run -w`
  ];

  public static args = [{name: 'passthrough'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    debug: flags.boolean({char: 'd', description: messages.getMessage('debugFlagDescription')}),
    watch: flags.boolean({char: 'w', description: messages.getMessage('watchFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  // protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<void> {
    if (this.flags.debug && this.flags.watch) {
      throw new core.SfdxError(messages.getMessage('errorInvalidFlags'));
    }

    // TODO(tbliss): how to handle where command is run? force run from project root? or pass cwd to lwc-jest and if they set own path append that to cwd?
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new core.SfdxError(messages.getMessage('errorNoPackageJsonFound'));
    }

    const packageJson = require(packageJsonPath);
    const scripts = packageJson.scripts;

    let targetScript = 'test:unit';
    if (this.flags.debug) {
      targetScript += ':debug';
    } else if (this.flags.watch) {
      targetScript += ':watch';
    }

    if (scripts[targetScript]) {
      console.log('>>> found matching script, running: ' + targetScript);
      spawn('npm', ['run', targetScript, this.args.passthrough], { stdio: "inherit" });
      // TODO(tbliss): should we return an object like the template?
      //               or wait for the child process to finish and have the exit code match the run?
      //               maybe spawnSync?
      return;
    }

    // TODO(tbliss): does this work in Windows too?
    const executablePath = path.join(process.cwd(), 'node_modules', '.bin', 'lwc-jest');
    if (!fs.existsSync(executablePath)) {
      throw new core.SfdxError(messages.getMessage('errorNoExecutableFound'));
    }

    let args = [];
    if (this.flags.debug) {
      args.push('--debug');
    } else if (this.flags.watch) {
      args.push('--watch');
    }
    !!this.args.passthrough && args.push(this.args.passthrough);

    spawn(executablePath, args, { stdio: "inherit", cwd: process.cwd() });
  }
}
