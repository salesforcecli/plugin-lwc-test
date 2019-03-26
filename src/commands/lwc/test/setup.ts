import { SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { FileWriter } from '../../../lib/fileWriter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-lwc-test', 'setup');

const testScripts = {
  'test:unit': 'lwc-jest',
  'test:unit:debug': 'lwc-jest --debug',
  'test:unit:watch': 'lwc-jest --watch'
};

const jestConfig = `const { jestConfig } = require('@salesforce/lwc-jest/config');
module.exports = {
    ...jestConfig,
    // add any custom configurations here
};`;

const forceignoreEntry = '\n# LWC Jest tests\n**/__tests__/**';

export default class Setup extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx force:lightning:lwc:test:install'
  ];

  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const fileWriter = this.getFileWriter();

    const nodeVersionRet = spawnSync('node', ['-v']);
    if (nodeVersionRet.error || nodeVersionRet.status !== 0) {
      throw new SfdxError(messages.getMessage('errorNodeNotFound'));
    }
    const nodeVersion = nodeVersionRet.stdout.slice(1); // strip the v from v8.12.0
    if (nodeVersion < '8.12.0') {
      throw new SfdxError(messages.getMessage('errorNodeVersion', [nodeVersion]));
    }

    const npmVersionRet = spawnSync('npm', ['-v']);
    if (npmVersionRet.error || npmVersionRet.status !== 0) {
      throw new SfdxError(messages.getMessage('errorNpmNotFound'));
    }

    if (!fs.existsSync(this.getPackageJsonPath())) {
      throw new SfdxError(messages.getMessage('errorNoPackageJson'));
    }

    // separate out functionality to easier mock out blocks in tests
    this.updatePackageJsonScripts(fileWriter);
    this.addJestConfig(fileWriter);
    this.updateForceIgnore(fileWriter);

    this.ux.log('Making necessary file updates now...');
    fileWriter.writeFiles();
    this.ux.log('File modifications complete');

    // do this as the last step because it is hard to revert if experience an error from anything above
    this.installLwcJest();

    this.ux.log('Test setup complete');
    return {
      message: 'Test setup complete',
      exitCode: 0
    };
  }

  // pull out to own method for testability
  private getFileWriter(): FileWriter {
    return new FileWriter();
  }

  private getPackageJsonPath() {
    return path.join(this.project.getPath(), 'package.json');
  }

  private getPackageJson() {
    return require(this.getPackageJsonPath());
  }

  private updatePackageJsonScripts(fileWriter: FileWriter): void {
    const packageJson = this.getPackageJson();
    const scripts = packageJson.scripts;
    if (!scripts) {
      packageJson.scripts = testScripts;
      this.ux.log('Queueing addition of test scripts to package.json...');
      fileWriter.queueWrite(this.getPackageJsonPath(), JSON.stringify(packageJson, null, 2), { encoding: 'utf8' });
    } else if (!scripts['test:unit'] && !scripts['test:unit:debug'] && !scripts['test:unit:watch']) {
      this.ux.log('Queueing addition of test scripts to package.json...');
      packageJson.scripts = { ...scripts, ...testScripts};
      fileWriter.queueWrite(this.getPackageJsonPath(), JSON.stringify(packageJson, null, 2), { encoding: 'utf8' });
    } else {
      this.ux.log('One or more of the following package.json scripts already exists, skipping adding of test scripts: "test:unit", "test:unit:debug", "test:unit:watch"');
    }
  }

  private addJestConfig(fileWriter: FileWriter): void {
    const packageJson = this.getPackageJson();
    const jestConfigPath = path.join(this.project.getPath(), 'jest.config.js');
    const packageJsonJest = packageJson.jest;
    if (packageJsonJest) {
      this.ux.log('Jest configuration found in package.json. Skipping creation of jest.config.js file.');
    } else if (fs.existsSync(jestConfigPath)) {
      this.ux.log('Jest configuration found in jest.config.js. Skipping creation of new config file.');
    } else {
      // no known existing Jest config present in workspace
      this.ux.log('Queueing creation of jest.config.js file in project root...');
      fileWriter.queueWrite(jestConfigPath, jestConfig);
    }
  }

  private updateForceIgnore(fileWriter: FileWriter): void {
    const forceignorePath = path.join(this.project.getPath(), '.forceignore');
    if (!fs.existsSync(forceignorePath)) {
      this.ux.log('Queueing creation of .forceignore file in project root...');
      fileWriter.queueWrite(forceignorePath, forceignoreEntry);
    } else {
      const forceignore = fs.readFileSync(forceignorePath, { encoding: 'utf8' });
      if (forceignore.indexOf('**/__tests__/**') === -1) {
        this.ux.log('Queueing modification of .forceignore file in project root...');
        fileWriter.queueAppend(forceignorePath, forceignoreEntry, { encoding: 'utf8' });
      }
    }
  }

  private installLwcJest(): void {
    this.ux.log('Installing @salesforce/lwc-jest node package...');
    const lwcJestInstallRet = spawnSync('npm', ['add', '--save-dev', '@salesforce/lwc-jest'], { stdio: 'inherit' });
    if (lwcJestInstallRet.error) {
      throw new SfdxError(messages.getMessage('errorLwcJestInstall', [lwcJestInstallRet.error.message]));
    }
  }
}
