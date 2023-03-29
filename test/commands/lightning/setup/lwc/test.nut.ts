/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { GenerateResult } from '../../../../../src/commands/lightning/generate/lwc/test';

describe('lightning:setup:lwc:test', () => {
  let testSession: TestSession;

  before('prepare session and ensure environment variables', async () => {
    testSession = await TestSession.create({
      project: { gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc' },
    });
  });

  after(async () => {
    await testSession?.clean();
  });

  it('runs the setup command (human)', () => {
    const output = execCmd<GenerateResult>('lightning:setup:lwc:test', {
      ensureExitCode: 0,
    }).shellOutput;
    expect(output).to.include('Test setup complete.');
  });

  it("writes files, writes scripts if they don't exist", async () => {
    const pjsonPath = path.join(testSession.project.dir, 'package.json');
    const jestConfigPath = path.join(testSession.project.dir, 'jest.config.js');
    const forceignorePath = path.join(testSession.project.dir, '.forceignore');
    // remove test scripts
    let content = (await fs.promises.readFile(pjsonPath, 'utf-8'))
      .replace(/"test:unit:.*/, '')
      .replace(/"@salesforce\/sfdx-lwc-jest": ".*/, '');

    await fs.promises.writeFile(pjsonPath, content);
    // delete jest config
    fs.rmSync(jestConfigPath);
    fs.rmSync(forceignorePath);

    const output = execCmd<GenerateResult>('lightning:setup:lwc:test', {
      ensureExitCode: 0,
    }).shellOutput;

    expect(output).to.include('Test setup complete.');
    expect(fs.existsSync(jestConfigPath)).to.be.true;
    expect(fs.existsSync(forceignorePath)).to.be.true;

    content = await fs.promises.readFile(pjsonPath, 'utf-8');
    const forceignoreContent = fs.readFileSync(forceignorePath, 'utf-8');
    expect(forceignoreContent).to.include('**/__tests__/**');
    expect(content).to.include('"test:unit": "sfdx-lwc-jest --skipApiVersionCheck"');
    expect(content).to.include('"test:unit:coverage": "sfdx-lwc-jest --coverage --skipApiVersionCheck"');
    expect(content).to.include('"test:unit:debug": "sfdx-lwc-jest --debug --skipApiVersionCheck"');
    expect(content).to.include('"@salesforce/sfdx-lwc-jest": "^');
  });
});
