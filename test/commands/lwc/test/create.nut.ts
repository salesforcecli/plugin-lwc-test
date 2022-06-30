/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { CreateResult } from '../../../../src/commands/force/lightning/lwc/test/create';

describe('lightning:lwc:test:create', () => {
  let testSession: TestSession;
  let testDir;

  before('prepare session and ensure environment variables', async () => {
    testSession = await TestSession.create({
      project: { gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc' },
    });
    testDir = path.join(testSession.project.dir, 'force-app', 'main', 'default', 'lwc', 'brokerCard');
  });

  after(async () => {
    await testSession?.clean();
  });

  it('creates a __tests__ directory for the given lwc (json)', () => {
    // first, delete the lwc test
    fs.rmSync(path.join(testDir, '__tests__'), { recursive: true });

    const output = execCmd<CreateResult>(
      `force:lightning:lwc:test:create -f ${path.join(testDir, 'brokerCard.js')} --json`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput;
    expect(output.status).to.equal(0);
    expect(output.result.testPath).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output.result.className).to.equal('BrokerCard');
    expect(output.result.message).to.include('Test case successfully created:');
    expect(output.result.elementName).to.equal('c-broker-card');
  });

  it('creates a __tests__ directory for the given lwc (human)', () => {
    // first, delete the lwc test
    fs.rmSync(path.join(testDir, '__tests__'), { recursive: true });

    const output = execCmd<CreateResult>(`force:lightning:lwc:test:create -f ${path.join(testDir, 'brokerCard.js')}`, {
      ensureExitCode: 0,
    }).shellOutput;
    expect(output).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output).to.include('Test case successfully created:');
  });

  it('errors when a __tests__ directory already exists (human)', () => {
    const output = execCmd<CreateResult>(`force:lightning:lwc:test:create -f ${path.join(testDir, 'brokerCard.js')}`, {
      ensureExitCode: 1,
    }).shellOutput.stderr;
    expect(output).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output).to.include('Test file already exists:');
  });
});
