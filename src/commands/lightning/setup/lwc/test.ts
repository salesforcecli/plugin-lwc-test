/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loglevel, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import semverCompare = require('semver-compare');
import { FileWriter } from '../../../../lib/fileWriter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/sfdx-plugin-lwc-test', 'setup');

const testScripts = {
  'test:unit': 'sfdx-lwc-jest',
  'test:unit:debug': 'sfdx-lwc-jest --debug',
  'test:unit:watch': 'sfdx-lwc-jest --watch',
};

const jestConfig = `const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');
module.exports = {
    ...jestConfig,
    // add any custom configurations here
};`;

export type SetupResult = {
  message: string;
};

const forceignoreEntry = '\n# LWC Jest tests\n**/__tests__/**';

export default class SetupTest extends SfCommand<SetupResult> {
  public static readonly summary = messages.getMessage('commandDescription');
  public static readonly description = messages.getMessage('commandDescription');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;
  public static readonly deprecateAliases = true;
  public static readonly aliases = ['force:lightning:lwc:test:setup'];
  public static readonly flags = {
    loglevel,
  };

  public async run(): Promise<SetupResult> {
    await this.parse(SetupTest);
    const fileWriter = this.getFileWriter();

    checkNodeInstall();
    checkNpmInstall();

    if (!fs.existsSync(this.getPackageJsonPath())) {
      throw new SfError(messages.getMessage('errorNoPackageJson'));
    }

    // separate out functionality to easier mock out blocks in tests
    this.updatePackageJsonScripts(fileWriter);
    this.addJestConfig(fileWriter);
    this.updateForceIgnore(fileWriter);

    this.log(messages.getMessage('logFileUpdatesStart'));
    fileWriter.writeFiles();
    this.log('logFileUpdatesEnd');

    // do this as the last step because it is hard to revert if experience an error from anything above
    this.installLwcJest();

    this.log(messages.getMessage('logSuccess'));
    return Promise.resolve({
      message: messages.getMessage('logSuccess'),
    });
  }

  // pull out to own method for testability
  private getFileWriter(): FileWriter {
    return new FileWriter();
  }

  private getPackageJsonPath(): string {
    return path.join(this.project.getPath(), 'package.json');
  }

  private getPackageJson(): { scripts: Record<string, string>; jest: string } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return require(this.getPackageJsonPath());
  }

  private updatePackageJsonScripts(fileWriter: FileWriter): void {
    const packageJson = this.getPackageJson();
    const scripts = packageJson.scripts;
    if (!scripts) {
      packageJson.scripts = testScripts;
      this.log(messages.getMessage('logQueueScripts'));
      fileWriter.queueWrite(this.getPackageJsonPath(), JSON.stringify(packageJson, null, 2), { encoding: 'utf8' });
    } else if (!scripts['test:unit'] && !scripts['test:unit:debug'] && !scripts['test:unit:watch']) {
      this.log(messages.getMessage('logQueueScripts'));
      packageJson.scripts = { ...scripts, ...testScripts };
      fileWriter.queueWrite(this.getPackageJsonPath(), JSON.stringify(packageJson, null, 2), { encoding: 'utf8' });
    } else {
      this.log(messages.getMessage('logSkippingScripts'));
    }
  }

  private addJestConfig(fileWriter: FileWriter): void {
    const packageJson = this.getPackageJson();
    const jestConfigPath = path.join(this.project.getPath(), 'jest.config.js');
    const packageJsonJest = packageJson.jest;
    if (packageJsonJest) {
      this.log(messages.getMessage('logConfigInPackageJson'));
    } else if (fs.existsSync(jestConfigPath)) {
      this.log(messages.getMessage('logConfigInJestConfigJs'));
    } else {
      // no known existing Jest config present in workspace
      this.log(messages.getMessage('logQueueConfig'));
      fileWriter.queueWrite(jestConfigPath, jestConfig);
    }
  }

  private updateForceIgnore(fileWriter: FileWriter): void {
    const forceignorePath = path.join(this.project.getPath(), '.forceignore');
    if (!fs.existsSync(forceignorePath)) {
      this.log(messages.getMessage('logQueueForceignoreAdd'));
      fileWriter.queueWrite(forceignorePath, forceignoreEntry);
    } else {
      const forceignore = fs.readFileSync(forceignorePath, { encoding: 'utf8' });
      if (forceignore.indexOf('**/__tests__/**') === -1) {
        this.log('logQueueForceignoreModify');
        fileWriter.queueAppend(forceignorePath, forceignoreEntry, { encoding: 'utf8' });
      }
    }
  }

  private installLwcJest(): void {
    this.log('Installing @salesforce/sfdx-lwc-jest node package...');
    try {
      if (fs.existsSync(path.join(this.project.getPath(), 'yarn.lock'))) {
        this.log('Detected yarn.lock file, using yarn commands');
        execSync('yarn add --dev @salesforce/sfdx-lwc-jest', { stdio: 'inherit' });
      } else {
        execSync('npm install --save-dev @salesforce/sfdx-lwc-jest', { stdio: 'inherit' });
      }
    } catch (e) {
      throw new SfError(messages.getMessage('errorLwcJestInstall', [(e as Error).message]));
    }
  }
}

function checkNodeInstall(): void {
  let nodeVersionRet: Buffer;

  try {
    nodeVersionRet = execSync('node -v');
  } catch {
    throw new SfError(messages.getMessage('errorNodeNotFound'));
  }

  const nodeVersion = nodeVersionRet.toString().slice(1); // strip the v from v8.12.0
  // semver-compare returns -1 if first param is lower than second, 0 if they're equal, 1 if first param is higher
  if (semverCompare(nodeVersion, '8.12.0') < 0) {
    throw new SfError(messages.getMessage('errorNodeVersion', [nodeVersion]));
  }
}

function checkNpmInstall(): void {
  try {
    execSync('npm -v');
  } catch {
    throw new SfError(messages.getMessage('errorNpmNotFound'));
  }
}
