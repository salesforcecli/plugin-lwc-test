/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';

// eslint-disable-next-line
import Run from '../../../../lib/commands/force/lightning/lwc/test/run';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

const successReturn = { status: 0 } as cp.SpawnSyncReturns<Buffer>;

describe('force:lightning:lwc:test:run', () => {
  let runJestStub: sinon.SinonStub;

  beforeEach(() => {});

  afterEach(() => {
    $$.SANDBOX.restore();
  });

  test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('outputs completed message on status code 0', (ctx) => {
      expect(ctx.stdout).to.contain('Test run complete. Exited with status code: 0');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns({ status: 1 });
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('outputs completed message on status code 1 (failed tests)', (ctx) => {
      expect(ctx.stdout).to.contain('Test run complete. Exited with status code: 1');
    });

  test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--debug'])
    .it('passes --debug to runJest when debug flag set', () => {
      expect(runJestStub.args[0][0]).to.contain('--debug');
    });

  test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--watch'])
    .it('passes --watch to runJest when debug flag set', () => {
      expect(runJestStub.args[0][0]).to.contain('--watch');
    });

  test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', 'path/to/test'])
    .it('passes extra args to runJest', () => {
      expect(runJestStub.args[0][0]).to.contain('path/to/test');
    });

  test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--debug', 'path/to/test'])
    .it('passes extra args and debug flag to runJest', () => {
      expect(runJestStub.args[0][0]).to.contain('path/to/test');
      expect(runJestStub.args[0][0]).to.contain('--debug');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns({ status: 0 });
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--watch', '--debug'])
    .it('errors when watch and debug flag set', (ctx) => {
      // update for OCLIF exclusive error message
      expect(ctx.stderr).to.contain('--debug=true cannot also be provided when using --watch');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, cp, 'spawnSync').returns(successReturn);
      stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('sfdx-lwc-jest')).returns(false);
      (fs.existsSync as sinon.SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('logs no executable error when sfdx-lwc-jest path does not exist', (ctx) => {
      expect(ctx.stderr).to.contain('No sfdx-lwc-jest executable found');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, cp, 'spawnSync').returns(successReturn);
      stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('sfdx-lwc-jest')).returns(false);
      (fs.existsSync as sinon.SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('logs no executable error when sfdx-lwc-jest path does not exist', (ctx) => {
      expect(ctx.stderr).to.contain('No sfdx-lwc-jest executable found');
    });
});
