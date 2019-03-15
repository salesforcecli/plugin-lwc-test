import { core, flags, SfdxCommand } from '@salesforce/command';
import * as path from 'path';
import * as fs from 'fs';
import { spawnSync, SpawnSyncReturns } from 'child_process';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-lwc-test', 'run');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx force:lightning:lwc:test:run`,
  `$ sfdx force:lightning:lwc:test:run -w`
  ];

  public static args = [{name: 'passthrough'}];

  protected static flagsConfig = {
    debug: flags.boolean({char: 'd', description: messages.getMessage('debugFlagDescription')}),
    watch: flags.boolean({char: 'w', description: messages.getMessage('watchFlagDescription')})
  };

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<core.AnyJson> {
    const project = await core.Project.resolve();

    if (this.flags.debug && this.flags.watch) {
      throw new core.SfdxError(messages.getMessage('errorInvalidFlags'));
    }

    const packageJsonPath = path.join(project.getPath(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new core.SfdxError(messages.getMessage('errorNoPackageJsonFound'));
    }

    const packageJson = require(packageJsonPath);
    const scripts = packageJson.scripts;

    // the setup command adds 'test:unit', 'test:unit:debug', and 'test:unit:watch' scripts to package.json
    let targetScript = 'test:unit';
    if (this.flags.debug) {
      targetScript += ':debug';
    } else if (this.flags.watch) {
      targetScript += ':watch';
    }

    // TODO(tbliss): does it make sense to do package.json script first? or always just do node_modules?
    let scriptRet: SpawnSyncReturns<Buffer>;
    if (scripts[targetScript]) {
      // if package.json script exists, run that
      let args = ['run', targetScript];
      !!this.args.passthrough && args.push(this.args.passthrough);
      scriptRet = spawnSync('npm', args, { stdio: "inherit" });
    } else {
      // if no script found, try running executable in node_modules
      const executablePath = path.join(process.cwd(), 'node_modules', '.bin', 'lwc-jest');
      if (!fs.existsSync(executablePath)) {
        // no way to run lwc-jest, we need to bail
        throw new core.SfdxError(messages.getMessage('errorNoExecutableFound'));
      }

      let args = [];
      if (this.flags.debug) {
        args.push('--debug');
      } else if (this.flags.watch) {
        args.push('--watch');
      }
      !!this.args.passthrough && args.push(this.args.passthrough);

      scriptRet = spawnSync(executablePath, args, { stdio: "inherit" });
    }

      this.ux.log('Jest run complete. Exited with status code: ', scriptRet.status);
      return {
        message: 'Jest run complete',
        exitCode: scriptRet.status,
      };
  }
}
