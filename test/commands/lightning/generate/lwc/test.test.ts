/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import { join } from 'path';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { expect } from 'chai';
import { TestContext } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';
import { Config } from '@oclif/core';
import CreateTest from '../../../../../src/commands/lightning/generate/lwc/test';

const pathToFooJs = join(process.cwd(), 'path', 'to', 'js', 'foo.js');
const pathToFooTest = join(process.cwd(), 'path', 'to', 'js', '__tests__', 'foo.test.js');
const pathToFooHtml = join(process.cwd(), 'path', 'to', 'js', 'foo.html');
const pathToFooBarJs = join(process.cwd(), 'path', 'to', 'js', 'fooBar.js');
const pathToFooBarHtml = join(process.cwd(), 'path', 'to', 'js', 'fooBar.html');

describe('force:lightning:lwc:test:create', () => {
  // Mock all things in core, like api, file io, etc.
  const $$ = new TestContext();
  let writeFileSyncStub: sinon.SinonStub;

  it('outputs completed message on status code 0', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, fs, 'existsSync')
      .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml]))
      .returns(true)
      .withArgs(pathToFooTest)
      .returns(false);
    (fs.existsSync as SinonStub).callThrough();
    stubMethod($$.SANDBOX, fs, 'mkdirSync');
    stubMethod($$.SANDBOX, fs, 'writeFileSync');
    const create = new CreateTest(['-f', pathToFooJs], {} as Config);
    const result = await create.run();
    expect(result.message).to.contain('Test case successfully created');
  });

  it('creates test file in __tests__ folder of component bundle when .html file is missing', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, fs, 'existsSync')
      .withArgs(sinon.match.in([pathToFooJs]))
      .returns(true)
      .withArgs(pathToFooTest)
      .returns(false);
    (fs.existsSync as SinonStub).callThrough();
    stubMethod($$.SANDBOX, fs, 'mkdirSync');
    writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    const create = new CreateTest(['-f', pathToFooJs], {} as Config);
    await create.run();
    expect(writeFileSyncStub.args[0][0]).to.equal(pathToFooTest);
  });

  it('created test file has correct import statement', async () => {
    stubMethod($$.SANDBOX, fs, 'existsSync')
      .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml]))
      .returns(true)
      .withArgs(pathToFooTest)
      .returns(false);
    (fs.existsSync as SinonStub).callThrough();
    stubMethod($$.SANDBOX, fs, 'mkdirSync');
    writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    const create = new CreateTest(['-f', pathToFooJs], {} as Config);
    await create.run();
    expect(writeFileSyncStub.args[0][1]).to.contain("import Foo from 'c/foo';");
    expect(writeFileSyncStub.args[0][0]).to.equal(pathToFooTest);
  });

  it('created test file has describe block with kebab-case', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, fs, 'existsSync')
      .withArgs(sinon.match.in([pathToFooBarJs, pathToFooBarHtml]))
      .returns(true)
      .withArgs(join('', 'path', 'to', 'js', '__tests__', 'fooBar.test.js'))
      .returns(false);
    (fs.existsSync as SinonStub).callThrough();
    stubMethod($$.SANDBOX, fs, 'mkdirSync');
    writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    const create = new CreateTest(['-f', pathToFooBarJs], {} as Config);
    await create.run();
    expect(writeFileSyncStub.args[0][1]).to.contain("describe('c-foo-bar', () => {");
  });

  it('logs error if file path does not point to existing file', async () => {
    stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(pathToFooJs).returns(false);
    (fs.existsSync as SinonStub).callThrough();
    const create = new CreateTest(['-f', pathToFooJs], {} as Config);
    try {
      await create.run();
      expect.fail('Expected error to be thrown');
    } catch (e) {
      expect((e as Error).message).to.contain('File not found');
    }
  });

  it('logs error if test file already exists', async () => {
    $$.inProject(true);
    stubMethod($$.SANDBOX, fs, 'existsSync')
      .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml, pathToFooTest]))
      .returns(true);
    (fs.existsSync as SinonStub).callThrough();
    const create = new CreateTest(['-f', pathToFooJs], {} as Config);
    try {
      await create.run();
      expect.fail('Expected error to be thrown');
    } catch (e) {
      expect((e as Error).message).to.contain('Test file already exists');
    }
  });
});
