/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { TestContext } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';
import { Config } from '@oclif/core';
import { SfProject } from '@salesforce/core';
import RunTest from '../../../../../../src/commands/lightning/run/lwc/test';

const successReturn = { status: 0 } as cp.SpawnSyncReturns<Buffer>;

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
        const packagePath = path.join(projectDir, dir.path);
        fs.mkdirSync(packagePath, { recursive: true });
      }
    });
  project.getSfProjectJson().writeSync();
  return project;
}

class MyRunTest extends RunTest {
  public constructor(args: string[], config: Config) {
    super(args, config);
    this.project = setupProject();
  }
}

describe('force:lightning:lwc:test:run', () => {
  // Mock all things in core, like api, file io, etc.
  const $$ = new TestContext();
  let runJestStub: sinon.SinonStub;
  let run: MyRunTest;

  it('outputs completed message on status code 0', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns(successReturn);
    run = new MyRunTest([], {} as Config);
    const result = await run.run();
    expect(result.message).to.contain('Test run complete. Exited with status code: 0');
  });

  it('outputs completed message on status code 1 (failed tests)', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns({ status: 1 });
    run = new MyRunTest([], {} as Config);
    const result = await run.run();
    expect(result.message).to.contain('Test run complete. Exited with status code: 1');
  });

  it('passes --debug to runJest when debug flag set', async () => {
    $$.inProject(true);
    runJestStub = stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns(successReturn);
    run = new MyRunTest(['--debug'], {} as Config);
    await run.run();
    expect(runJestStub.args[0][0]).to.contain('--debug');
  });

  it('passes --watch to runJest when debug flag set', async () => {
    $$.inProject(true);
    runJestStub = stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns(successReturn);
    run = new MyRunTest(['--watch'], {} as Config);
    await run.run();
    expect(runJestStub.args[0][0]).to.contain('--watch');
  });

  it('passes extra args to runJest', async () => {
    $$.inProject(true);
    runJestStub = stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns(successReturn);
    run = new MyRunTest(['path/to/test'], {} as Config);
    await run.run();
    expect(runJestStub.args[0][0]).to.contain('path/to/test');
  });

  it('passes extra args and debug flag to runJest', async () => {
    $$.inProject(true);
    runJestStub = stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns(successReturn);
    run = new MyRunTest(['--debug', 'path/to/test'], {} as Config);
    await run.run();
    expect(runJestStub.args[0][0]).to.contain('path/to/test');
    expect(runJestStub.args[0][0]).to.contain('--debug');
  });

  it('errors when watch and debug flag set', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, MyRunTest.prototype, 'runJest').returns({ status: 0 });
    run = new MyRunTest(['--watch', '--debug'], {} as Config);
    try {
      await run.run();
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect((e as Error).message).to.contain('--debug=true cannot also be provided when using --watch');
    }
  });

  it('logs no executable error when sfdx-lwc-jest path does not exist', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, cp, 'spawnSync').returns(successReturn);
    stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('sfdx-lwc-jest')).returns(false);
    (fs.existsSync as sinon.SinonStub).callThrough();
    run = new MyRunTest([], {} as Config);
    try {
      await run.run();
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect((e as Error).message).to.contain('No sfdx-lwc-jest executable found');
    }
  });

  it('logs no executable error when sfdx-lwc-jest path does not exist', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, cp, 'spawnSync').returns(successReturn);
    stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(sinon.match('sfdx-lwc-jest')).returns(false);
    (fs.existsSync as sinon.SinonStub).callThrough();
    run = new MyRunTest([], {} as Config);
    try {
      await run.run();
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect((e as Error).message).to.contain('No sfdx-lwc-jest executable found');
    }
  });
});
