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
import { GenerateResult } from '../../../../../src/commands/lightning/generate/lwc/test';

describe('lightning:generate:lwc:test', () => {
  let testSession: TestSession;
  let testDir: string;

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

    const output = execCmd<GenerateResult>(
      `lightning:generate:lwc:test -f ${path.join(testDir, 'brokerCard.js')} --json`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput;
    expect(output?.status).to.equal(0);
    expect(output?.result.testPath).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output?.result.className).to.equal('BrokerCard');
    expect(output?.result.message).to.include('Test case successfully created:');
    expect(output?.result.elementName).to.equal('c-broker-card');
  });

  it('creates a __tests__ directory for the given lwc (human)(cmd alias)', () => {
    // first, delete the lwc test
    fs.rmSync(path.join(testDir, '__tests__'), { recursive: true });

    const output = execCmd<GenerateResult>(
      `force:lightning:lwc:test:create --filepath ${path.join(testDir, 'brokerCard.js')}`,
      {
        ensureExitCode: 0,
      }
    ).shellOutput;
    expect(output).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output).to.include('Test case successfully created:');
  });

  it('errors when a __tests__ directory already exists (human)', () => {
    const output = execCmd<GenerateResult>(`lightning:generate:lwc:test -f ${path.join(testDir, 'brokerCard.js')}`, {
      ensureExitCode: 1,
    }).shellOutput.stderr;
    expect(output).to.include(path.join(testDir, '__tests__', 'brokerCard.test.js'));
    expect(output).to.include('Test file already exists:');
  });
});
