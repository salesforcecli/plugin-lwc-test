import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'run');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    messages.getMessage('example1'),
    messages.getMessage('example2')
  ];

  public static args = [{name: 'passthrough'}];

  protected static flagsConfig = {
    debug: flags.boolean({
      char: 'd',
      description: messages.getMessage('debugFlagDescription'),
      longDescription: messages.getMessage('debugFlagLongDescription')
      // exclusive: ['watch']
    }),
    watch: flags.boolean({
      description: messages.getMessage('watchFlagDescription'),
      longDescription: messages.getMessage('watchFlagLongDescription')
      // exclusive: ['debug']
    })
  };

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const args = [];

    // TODO(tbliss): how to use 'exclusive' setting above? exclusive not a valid prop for boolean flags
    if (this.flags.debug && this.flags.watch) {
      throw new SfdxError(messages.getMessage('errorInvalidFlags'));
    }

    if (this.flags.debug) {
      args.push('--debug');
    } else if (this.flags.watch) {
      args.push('--watch');
    }
    if (this.args.passthrough) {
      args.push(this.args.passthrough);
    }

    const scriptRet = this.runJest(args);

    this.ux.log(messages.getMessage('logSuccess', [scriptRet.status.toString()]));
    return {
      message: messages.getMessage('logSuccess', [scriptRet.status.toString()]),
      jestExitCode: scriptRet.status
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

    const executablePath = path.join(projectPath, 'node_modules', nodeModulePath);
    if (!fs.existsSync(executablePath)) {
      throw new SfdxError(messages.getMessage('errorNoExecutableFound'));
    }
    return executablePath;
  }
}
