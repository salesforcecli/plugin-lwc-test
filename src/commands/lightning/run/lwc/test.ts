/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {spawn, spawnSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {Flags, loglevel, SfCommand} from '@salesforce/sf-plugins-core';
import {Messages} from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'run');

export type RunResult = {
  message: string;
  jestExitCode: number;
  jestResults?: Record<string, unknown>;
  stderr?: string;
};

export default class RunTest extends SfCommand<RunResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:lightning:lwc:test:run'];
  public static strict = false;
  public static '--' = true;
  // sfdx-lwc-jest flags `--version` and`--help` cannot be defined in flags given they are reserved by oclif
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
    coverage: Flags.boolean({
      summary: messages.getMessage('flags.coverage.summary'),
      description: messages.getMessage('flags.coverage.description'),
    }),
    // eslint-disable-next-line sf-plugin/flag-case
    updateSnapshot: Flags.boolean({
      char: 'u',
      summary: messages.getMessage('flags.updateSnapshot.summary'),
      description: messages.getMessage('flags.updateSnapshot.description'),
    }),
    verbose: Flags.boolean({
      summary: messages.getMessage('flags.verbose.summary'),
      description: messages.getMessage('flags.verbose.description'),
    }),
    // eslint-disable-next-line sf-plugin/flag-case
    skipApiVersionCheck: Flags.boolean({
      summary: messages.getMessage('flags.skipApiVersionCheck.summary'),
      description: messages.getMessage('flags.skipApiVersionCheck.description'),
    }),
    loglevel,
  };

  private flagKeys = Object.keys(RunTest.flags);

  public async run(): Promise<RunResult> {
    this.validateFlags();
    const cmdArgs = this.rearrangeCmdArgs(this.argv);

    // call parse using RunTest config to validate this command's flags
    await this.parse(RunTest);

    if (this.jsonEnabled()) {
      const jsonIndex = cmdArgs.indexOf('--json');
      // remove the left hand json flag from the cmdArgs array
      cmdArgs.splice(jsonIndex, 1);
    }

    this.maybeEnableJestJsonFlag(cmdArgs);

    const results = await this.runJest(cmdArgs);
    const message = results.message === '' ? '' : ` (Message: ${results.message})`;
    results.message = messages.getMessage('logSuccess', [
      results.jestExitCode,
      message,
    ]);

    this.logSuccess(results.message);
    return results;
  }


  public runJest(args: string[]): Promise<RunResult> {
    // is json flag present for jest?
    const jestJsonEnabled = args.includes('--json');
    // on windows we must execute with the node prefix
    const executable = process.platform === 'win32' ? `node ${this.getExecutablePath()}` : this.getExecutablePath();
    let stdout = '';
    let stderr = '';
    // create a child process spawn that will handle results like the unix "tee" command
    return new Promise<RunResult>((resolve): void => {
      if (jestJsonEnabled) {
        let message = '';
        const cp = spawn(executable, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
        });
        cp.on('error', (error) => {
          this.log(`Error executing command: ${error.message}`);
          message = error.message;
          throw error;
        });
        // only thing emitted to stdout is jest json results, so only capture that
        cp.stdout.on('data', (data: string) => {
          stdout = stdout + data;
        });
        cp.stderr.on('data', (data: string) => {
          stderr = stderr + data.toString();
        });
        cp.on('exit', (code) => {
          // eslint-disable-next-line no-console
          let exitCode = code ?? 0;
          let jestResults;
          try {
            jestResults = stdout.length > 0 ? JSON.parse(stdout) as Record<string, unknown> : undefined;
          } catch (err) {
            message = (err as Error).message ?? 'An error occurred while parsing the jest results';
            exitCode = 1;
          }
          resolve({
            message,
            jestExitCode: exitCode,
            jestResults,
            stderr: stderr.length > 0 ? stderr : undefined
          });
        });
      } else {
        const cp = spawnSync(executable, args, {
          stdio: 'inherit',
          shell: true,
        });
        resolve({
          message: cp.error?.message ?? '',
          jestExitCode: cp.status ?? 0,
        });
      }
    });
  }

  private rearrangeCmdArgs(argv: unknown[]): string[] {
    const passThroughIndex = argv.indexOf('--');
    // find indexes of json flags
    const jsonIndexes = argv.reduce((indexes: number[], arg, index) => {
      if (arg === '--json') {
        indexes.push(index);
      }
      return indexes;
    }, []);
    let jsonCount = 0;
    const cmdArgs = argv.map(arg => arg as string)
      .filter(arg => arg !== '--')
      .reduce((jestArgs: string[], arg: string) => {
        // not a flag, so add it to the end
        if (!arg.startsWith('-')) {
          jestArgs.push(arg);
          return jestArgs;
        }
        // get the arg sans hyphen
        const argSansHyphen = (arg).replace(/^-+/, '');

        if (argSansHyphen === 'json') {
          if (jsonIndexes[jsonCount++] > passThroughIndex) {
            jestArgs.push(arg);
          }
          return jestArgs;
        }
        if (this.flagKeys.some(key => key === argSansHyphen || RunTest.flags[key as keyof typeof RunTest.flags].char === argSansHyphen)) {
          jestArgs.unshift(arg);
        } else {
          jestArgs.push(arg);
        }
        return jestArgs;
      }, ['--']);
    // remove the '--' if it is the last element
    return cmdArgs[cmdArgs.length - 1] === '--' ? cmdArgs.slice(0, -1) : cmdArgs;
  }

  private maybeEnableJestJsonFlag(cmdArgs: string[]): void {
    if (this.jsonEnabled()) {
      if (!cmdArgs.includes('--json')) {
        if (!cmdArgs.includes('--')) {
          // add pass through flag to the cmdArgs array
          cmdArgs.push('--');
        }
        // add the jest json flag to the cmdArgs array
        cmdArgs.push('--json');
      }
    }
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

  private validateFlags(): void {
    // check if --json is being passed as part of pass though args
    const ptIndex = this.argv.indexOf('--');
    const jestJsonIndex = this.argv.indexOf('--json') > ptIndex;
    // throw error if json is not enabled and pass through --json flag is present
    if (!this.jsonEnabled()) {
      if (jestJsonIndex) {
        throw messages.createError('mustUseJsonFlag');
      } else {
        this.warn(messages.getMessage('jestJsonFlagWarning'));
      }
    }

      if (this.jsonEnabled() && this.argv.some(arg => arg.includes('watch'))) {
        throw messages.createError('watchCannotBeUsedWithJsonFlag');
      }
  }
}
