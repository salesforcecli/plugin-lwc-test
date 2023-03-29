/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Flags, loglevel, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { Args } from '@oclif/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'run');

export type RunResult = {
  message: string;
  jestExitCode: number;
};

export default class RunTest extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('commandDescription');
  public static readonly description = messages.getMessage('longDescription');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;
  public static args = { passthrough: Args.string({ description: 'passthrough arg' }) };
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:lightning:lwc:test:run'];
  public static readonly flags = {
    debug: Flags.boolean({
      char: 'd',
      summary: messages.getMessage('debugFlagDescription'),
      description: messages.getMessage('debugFlagLongDescription'),
    }),
    watch: Flags.boolean({
      summary: messages.getMessage('watchFlagDescription'),
      description: messages.getMessage('watchFlagLongDescription'),
      exclusive: ['debug'],
    }),
    loglevel,
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<RunResult> {
    const { args, flags } = await this.parse(RunTest);
    const addArgs: string[] = [];

    if (flags.debug) {
      addArgs.push('--debug');
    } else if (flags.watch) {
      addArgs.push('--watch');
    }
    if (args.passthrough) {
      addArgs.push(args.passthrough);
    }

    const scriptRet = this.runJest(addArgs);

    this.log(messages.getMessage('logSuccess', [scriptRet.status?.toString()]));
    return {
      message: messages.getMessage('logSuccess', [scriptRet.status?.toString()]),
      jestExitCode: scriptRet.status ?? 1,
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
      throw messages.createError('errorNoExecutableFound', [this.config.bin]);
    }
    return executablePath;
  }
}
