/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'run');

export type RunResult = {
  message: string;
  jestExitCode: number;
};

export default class Run extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');
  public static longDescription = messages.getMessage('longDescription');
  public static examples = [messages.getMessage('example1'), messages.getMessage('example2')];
  public static args = [{ name: 'passthrough' }];
  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;
  protected static flagsConfig = {
    debug: flags.boolean({
      char: 'd',
      description: messages.getMessage('debugFlagDescription'),
      longDescription: messages.getMessage('debugFlagLongDescription'),
      exclusive: ['watch'],
    }),
    watch: flags.boolean({
      description: messages.getMessage('watchFlagDescription'),
      longDescription: messages.getMessage('watchFlagLongDescription'),
      exclusive: ['debug'],
    }),
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<RunResult> {
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

    this.ux.log(messages.getMessage('logSuccess', [scriptRet.status.toString()]));
    process.exitCode=scriptRet.status;
    return {
      message: messages.getMessage('logSuccess', [scriptRet.status.toString()]),
      jestExitCode: scriptRet.status,
    };
  }

  public runJest(args: string[]): cp.SpawnSyncReturns<Buffer> {
    // on windows we must execute with the node prefix
    const executable = process.platform === 'win32' ? `node ${this.getExecutablePath()}` : this.getExecutablePath();

    return cp.spawnSync(executable, args, {
      stdio: 'inherit',
      shell: true,
    });
  }

  private getExecutablePath(): string {
    const projectPath = this.project.getPath();
    const nodeModulePath =
      process.platform === 'win32'
        ? path.join('@salesforce', 'sfdx-lwc-jest', 'bin', 'sfdx-lwc-jest')
        : path.join('.bin', 'sfdx-lwc-jest');

    const executablePath = path.join(projectPath, 'node_modules', nodeModulePath);
    if (!fs.existsSync(executablePath)) {
      throw new SfError(messages.getMessage('errorNoExecutableFound'));
    }
    return executablePath;
  }
}
