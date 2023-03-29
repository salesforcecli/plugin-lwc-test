/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import * as cp from 'child_process';
import { join } from 'path';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { expect } from 'chai';
import { TestContext } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';
import { Config } from '@oclif/core';
import { SfProject } from '@salesforce/core';
import SetupTest from '../../../../../src/commands/lightning/setup/lwc/test';

const VALID_NODE_VERSION_STDOUT = 'v8.12.0\n';
const VALID_NPM_VERSION_STDOUT = 'v6.0.0\n';

function setupProject(setup: (project: SfProject) => void = () => {}) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const project = new SfProject('a') as SfProject;
  const packageDirectories = [
    {
      path: 'force-app',
      default: true,
    },
  ];
  const packageAliases = {};
  project.getSfProjectJson().set('packageDirectories', packageDirectories);
  project.getSfProjectJson().set('packageAliases', packageAliases);
  setup(project);
  const projectDir = project.getPath();
  project
    .getSfProjectJson()
    .getContents()
    .packageDirectories?.forEach((dir) => {
      if (dir.path) {
        const packagePath = join(projectDir, dir.path);
        fs.mkdirSync(packagePath, { recursive: true });
      }
    });
  project.getSfProjectJson().writeSync();
  return project;
}

class MySetupTest extends SetupTest {
  public constructor(args: string[], config: Config) {
    super(args, config);
    this.project = setupProject();
  }
}

describe('lightning:setup:test', () => {
  // Mock all things in core, like api, file io, etc.
  const $$ = new TestContext();

  let setup: MySetupTest;

  const fileWriterStub = {
    queueWrite: sinon.stub(),
    writeFiles: sinon.stub(),
    queueAppend: sinon.stub(),
  };

  afterEach(() => {
    fileWriterStub.queueWrite.reset();
    fileWriterStub.writeFiles.reset();
    fileWriterStub.queueAppend.reset();
  });

  describe('without proper environment', () => {
    it('logs error when node returns non-zero exit code', async () => {
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          throw new Error('Invalid command: node -v');
        }
      });
      setup = new MySetupTest([], {} as Config);
      try {
        await setup.run();
      } catch (e) {
        expect((e as Error).message).to.contain('Could not retrieve Node.js version');
      }
    });

    it('logs error when node version is too low', async () => {
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return 'v6.17.0\n';
        }
      });
      setup = new MySetupTest([], {} as Config);
      try {
        await setup.run();
      } catch (e) {
        expect((e as Error).message).to.contain('Node.js version too low');
      }
    });

    it('logs error when npm returns non-zero exit code', async () => {
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          throw new Error('Invalid command: npm -v');
        }
      });
      setup = new MySetupTest([], {} as Config);
      try {
        await setup.run();
      } catch (e) {
        expect((e as Error).message).to.contain('npm command not found');
      }
    });

    it('logs error no package.json present', async () => {
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      setup = new MySetupTest([], {} as Config);
      try {
        await setup.run();
      } catch (e) {
        expect((e as Error).message).to.contain('No package.json found at root of project');
      }
    });
  });

  describe('package.json', () => {
    it('with no test scripts adds scripts to package.json', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(/.*?package\.json$/))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      // this stub is key. we have a package.json but no "scripts" section
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'no test scripts',
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      // first param is the path, just make sure this is the package.json write
      expect(fileWriterStub.queueWrite.args[0][0]).to.contain('package.json');
      // second param is the content - verify contains test scripts
      expect(fileWriterStub.queueWrite.args[0][1]).to.contain('"test:unit": "sfdx-lwc-jest"');
    });

    it('with test scripts, appends scripts to package.json if no conflicts', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(/.*?package\.json$/))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'from test',
        scripts: {
          foo: 'bar',
        },
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      // first param is the path, just make sure this is the package.json write
      expect(fileWriterStub.queueWrite.args[0][0]).to.contain('package.json');
      // second param is the content - verify contains test scripts
      expect(fileWriterStub.queueWrite.args[0][1]).to.contain('"test:unit": "sfdx-lwc-jest"');
    });

    it('with test script conflict, does not write to package.json', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(/.*?package\.json$/))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'from test',
        scripts: {
          'test:unit': 'bar',
        },
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.called).to.equal(false);
    });
  });

  describe('jest config', () => {
    it('does not write a jest.config.js file if jest config exists in package.json', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(/.*?package\.json$/))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'from test',
        jest: {
          verbose: true,
        },
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.called).to.equal(false);
    });

    it('does not write a jest.config.js file if jest.config.js file already exists', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(/.*?package\.json$/))
        .returns(true)
        .withArgs(sinon.match(sinon.match(/.*jest.config.js$/)))
        .returns(true);

      (fs.existsSync as SinonStub).callThrough();

      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'from test',
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.called).to.equal(false);
    });

    it('write a jest.config.js file if no existing config found', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(sinon.match(/.*?package\.json$/)))
        .returns(true)
        .withArgs(sinon.match(sinon.match(/.*jest.config.js$/)))
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson').returns({
        name: 'from test',
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updateForceIgnore');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.args[0][0]).to.contain('jest.config.js');
      expect(fileWriterStub.queueWrite.args[0][1]).to.contain(
        "const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config'"
      );
    });
  });

  describe('.forceignore', () => {
    it('writes new .forceignore file if one does not exist', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(sinon.match(/.*?package\.json$/)))
        .returns(true)
        .withArgs(sinon.match(sinon.match(/.*forceignore.*/)))
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.args[0][0]).to.contain('.forceignore');
      expect(fileWriterStub.queueWrite.args[0][1]).to.contain('**/__tests__/**');
    });

    it('appends test entry to existing .forceignore file', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(sinon.match(/.*?package\.json$/)))
        .returns(true)
        .withArgs(sinon.match(sinon.match(/.*forceignore.*/)))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'readFileSync').callsFake((path: string) => {
        if (path.indexOf('forceignore') !== -1) {
          return 'from test';
        }
        return '';
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueAppend.args[0][0]).to.contain('.forceignore');
      expect(fileWriterStub.queueAppend.args[0][1]).to.contain('**/__tests__/**');
    });

    it('does not write to forceignore if test entry already exists', async () => {
      $$.inProject(true);
      stubMethod($$.SANDBOX, cp, 'spawnSync').callsFake((cmd) => {
        if (cmd === 'node -v') {
          return VALID_NODE_VERSION_STDOUT;
        }
        if (cmd === 'npm -v') {
          return VALID_NPM_VERSION_STDOUT;
        }
      });
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match(sinon.match(/.*?package\.json$/)))
        .returns(true)
        .withArgs(sinon.match(sinon.match(/.*forceignore.*/)))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'readFileSync').callsFake((path: string) => {
        if (path.indexOf('forceignore') !== -1) {
          return '**/__tests__/**';
        }
        return '';
      });
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getFileWriter').returns(fileWriterStub);
      stubMethod($$.SANDBOX, SetupTest.prototype, 'updatePackageJsonScripts');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'getPackageJson');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'addJestConfig');
      stubMethod($$.SANDBOX, SetupTest.prototype, 'installLwcJest');
      setup = new MySetupTest([], {} as Config);
      await setup.run();

      expect(fileWriterStub.queueWrite.called).to.equal(false);
      expect(fileWriterStub.queueAppend.called).to.equal(false);
    });
  });
});
