/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {Flags, loglevel, SfCommand} from '@salesforce/sf-plugins-core';
import {Messages} from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'run');

export type RunResult = {
  message: string;
  jestExitCode: number;
};

export default class RunTest extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:lightning:lwc:test:run'];
  public static strict = false;
  public static '--' = true;
  public static readonly flags = {
    debug: Flags.boolean({
      char: 'd',
      summary: messages.getMessage('flags.debug.summary'),
      description: messages.getMessage('flags.debug.description'),
    }),
    watch: Flags.boolean({
      summary: messages.getMessage('flags.watch.summary'),
      description: messages.getMessage('flags.watch.description'),
      exclusive: ['debug'],
    }),
    loglevel,
  };

  public async run(): Promise<RunResult> {
    const addArgs: string[] = [];
    const tArgv = this.argv.filter((arg) => arg !== '--');
    const {argv} = await this.parse({strict: false, '--': true},
      ['--', ...tArgv]);
    addArgs.push(...argv.map((arg) => arg as string));

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
