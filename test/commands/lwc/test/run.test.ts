/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';
import Run from '../../../../src/commands/force/lightning/lwc/test/run';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

const successReturn = { status: 0 };

describe('force:lightning:lwc:test:run', () => {
  let runJestStub;

  test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('outputs completed message on status code 0', ctx => {
      expect(ctx.stdout).to.contain('Test run complete. Exited with status code: 0');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns({ status: 1 });
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('outputs completed message on status code 1 (failed tests)', ctx => {
      expect(ctx.stdout).to.contain('Test run complete. Exited with status code: 1');
    });

    test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns(successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--debug'])
    .it('passes --debug to runJest when debug flag set', ctx => {
      expect(runJestStub.args[0][0]).to.contain('--debug');
    });

    test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns (successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--watch'])
    .it('passes --watch to runJest when debug flag set', ctx => {
      expect(runJestStub.args[0][0]).to.contain('--watch');
    });

    test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns (successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', 'path/to/test'])
    .it('passes extra args to runJest', ctx => {
      expect(runJestStub.args[0][0]).to.contain('path/to/test');
    });

    test
    .do(() => {
      runJestStub = stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns (successReturn);
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:run', '--debug', 'path/to/test'])
    .it('passes extra args and debug flag to runJest', ctx => {
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
    .it('errors when watch and debug flag set', ctx => {
      expect(ctx.stderr).to.contain('Specify only --debug or --watch, not both')
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync').returns(successReturn);
      stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('lwc-jest')).returns(false);
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('logs no executable error when lwc-jest path does not exist', ctx => {
      expect(ctx.stderr).to.contain('No lwc-jest executable found');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync').returns(successReturn);
      stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('lwc-jest')).returns(false);
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:run'])
    .it('logs no executable error when lwc-jest path does not exist', ctx => {
      expect(ctx.stderr).to.contain('No lwc-jest executable found');
    });
});
