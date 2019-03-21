import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/plugin-lwc-test', 'run');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx force:lightning:lwc:test:run',
    '$ sfdx force:lightning:lwc:test:run -w'
  ];

  public static args = [{name: 'passthrough'}];

  protected static flagsConfig = {
    debug: flags.boolean({
      char: 'd',
      description: messages.getMessage('debugFlagDescription'),
      exclusive: ['watch']
    }),
    watch: flags.boolean({
      char: 'w',
      description: messages.getMessage('watchFlagDescription'),
      exclusive: ['debug']
    })
  };

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const args = [];
    if (this.flags.debug) {
      args.push('--debug');
    } else if (this.flags.watch) {
      args.push('--watch');
    }
    if (this.args.passthrough) {
      args.push(this.args.passthrough);
    }

    const scriptRet = this.runJest(args);

    this.ux.log('Test run complete. Exited with status code:', scriptRet.status.toString());
    return {
      message: 'Test run complete',
      exitCode: scriptRet.status
    };
  }

  private runJest(args) {
    return spawnSync(this.getExecutablePath(), args, { stdio: 'inherit' });
  }

  private getExecutablePath() {
    const projectPath = this.project.getPath();
    const nodeModulePath = process.platform === 'win32' ?
      path.join('@salesforce', 'lwc-jest', 'bin', 'lwc-jest') :
      path.join('.bin', 'lwc-jest');

    let executablePath = path.join(projectPath, 'node_modules', nodeModulePath);
    if (!fs.existsSync(executablePath)) {
      executablePath = path.join(__dirname, '..', '..', '..', '..', 'node_modules', nodeModulePath);
      if (!fs.existsSync(executablePath)) {
        throw new SfdxError(messages.getMessage('errorNoExecutableFound'));
      }
    }
    return executablePath;
  }
}
