/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import * as cp from 'child_process';
import * as sinon from 'sinon';
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';
import { SinonStub } from 'sinon';
import Setup from '../../../../src/commands/force/lightning/lwc/test/setup';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

const VALID_NODE_VERSION_STDOUT = 'v8.12.0\n';
const VALID_NPM_VERSION_STDOUT = 'v6.0.0\n';

describe('force:lightning:lwc:test:setup', () => {
  const fileWriterStub = {
    queueWrite: sinon.stub(),
    writeFiles: sinon.stub(),
    queueAppend: sinon.stub(),
  };

  afterEach(() => {
    fileWriterStub.queueWrite.reset();
    fileWriterStub.writeFiles.reset();
    fileWriterStub.queueAppend.reset();
    $$.SANDBOX.restore();
  });

  describe('without proper environment', () => {
    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            throw new Error('Invalid command: node -v');
          }
        });
      })
      .stdout()
      .stderr()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('logs error when node returns non-zero exit code', (ctx) => {
        expect(ctx.stderr).to.contain('Could not retrieve Node.js version');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return 'v6.17.0\n';
          }
        });
      })
      .stdout()
      .stderr()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('logs error when node version is too low', (ctx) => {
        expect(ctx.stderr).to.contain('Node.js version too low');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            throw new Error('Invalid command: npm -v');
          }
        });
      })
      .stdout()
      .stderr()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('logs error when npm returns non-zero exit code', (ctx) => {
        expect(ctx.stderr).to.contain('npm command not found');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
      })
      .stdout()
      .stderr()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('logs error no package.json present', (ctx) => {
        expect(ctx.stderr).to.contain('No package.json found at root of project');
      });
  });

  describe('package.json', () => {
    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/))
          .returns(true);
        (fs.existsSync as SinonStub).callThrough();
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        // this stub is key. we have a package.json but no "scripts" section
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'no test scripts',
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .stderr()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('with no test scripts adds scripts to package.json', () => {
        // first param is the path, just make sure this is the package.json write
        expect(fileWriterStub.queueWrite.args[0][0]).to.contain('package.json');
        // second param is the content - verify contains test scripts
        expect(fileWriterStub.queueWrite.args[0][1]).to.contain('"test:unit": "sfdx-lwc-jest"');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/))
          .returns(true);
        (fs.existsSync as SinonStub).callThrough();
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'from test',
          scripts: {
            foo: 'bar',
          },
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('with test scripts, appends scripts to package.json if no conflicts', () => {
        // first param is the path, just make sure this is the package.json write
        expect(fileWriterStub.queueWrite.args[0][0]).to.contain('package.json');
        // second param is the content - verify contains test scripts
        expect(fileWriterStub.queueWrite.args[0][1]).to.contain('"test:unit": "sfdx-lwc-jest"');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'from test',
          scripts: {
            'test:unit': 'bar',
          },
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('with test script conflict, does not write to package.json', () => {
        expect(fileWriterStub.queueWrite.called).to.equal(false);
      });
  });

  describe('jest config', () => {
    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'from test',
          jest: {
            verbose: true,
          },
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('does not write a jest.config.js file if jest config exists in package.json', () => {
        expect(fileWriterStub.queueWrite.called).to.equal(false);
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'from test',
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('does not write a jest.config.js file if jest.config.js file already exists', () => {
        expect(fileWriterStub.queueWrite.called).to.equal(false);
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/)))
          .returns(true)
          .withArgs(sinon.match(sinon.match(/.*jest.config.js$/)))
          .returns(false);
        (fs.existsSync as SinonStub).callThrough();
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson').returns({
          name: 'from test',
        });
        stubMethod($$.SANDBOX, Setup.prototype, 'updateForceIgnore');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('write a jest.config.js file if no existing config found', () => {
        expect(fileWriterStub.queueWrite.args[0][0]).to.contain('jest.config.js');
        expect(fileWriterStub.queueWrite.args[0][1]).to.contain(
          "const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config'"
        );
      });
  });

  describe('.forceignore', () => {
    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/)))
          .returns(true)
          .withArgs(sinon.match(sinon.match(/.*forceignore.*/)))
          .returns(false);
        (fs.existsSync as SinonStub).callThrough();
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson');
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('writes new .forceignore file if one does not exist', () => {
        expect(fileWriterStub.queueWrite.args[0][0]).to.contain('.forceignore');
        expect(fileWriterStub.queueWrite.args[0][1]).to.contain('**/__tests__/**');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'execSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/)))
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
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson');
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('appends test entry to existing .forceignore file', () => {
        expect(fileWriterStub.queueAppend.args[0][0]).to.contain('.forceignore');
        expect(fileWriterStub.queueAppend.args[0][1]).to.contain('**/__tests__/**');
      });

    test
      .do(() => {
        stubMethod($$.SANDBOX, cp, 'spawnSync').callsFake((cmd) => {
          if (cmd === 'node -v') {
            return VALID_NODE_VERSION_STDOUT;
          }
          if (cmd === 'npm -v') {
            return VALID_NPM_VERSION_STDOUT;
          }
        });
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match(sinon.match(/.*[/\\]sfdx_core[/\\]local[/\\]package\.json$/)))
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
        stubMethod($$.SANDBOX, Setup.prototype, 'getFileWriter').returns(fileWriterStub);
        stubMethod($$.SANDBOX, Setup.prototype, 'updatePackageJsonScripts');
        stubMethod($$.SANDBOX, Setup.prototype, 'getPackageJson');
        stubMethod($$.SANDBOX, Setup.prototype, 'addJestConfig');
        stubMethod($$.SANDBOX, Setup.prototype, 'installLwcJest');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:setup'])
      .it('does not write to forceignore if test entry already exists', () => {
        expect(fileWriterStub.queueWrite.called).to.equal(false);
        expect(fileWriterStub.queueAppend.called).to.equal(false);
      });
  });
});
