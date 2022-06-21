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
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

const pathToFooJs = join(process.cwd(), 'path', 'to', 'js', 'foo.js');
const pathToFooTest = join(process.cwd(), 'path', 'to', 'js', '__tests__', 'foo.test.js');
const pathToFooHtml = join(process.cwd(), 'path', 'to', 'js', 'foo.html');
const pathToFooBarJs = join(process.cwd(), 'path', 'to', 'js', 'fooBar.js');
const pathToFooBarHtml = join(process.cwd(), 'path', 'to', 'js', 'fooBar.html');

describe('force:lightning:lwc:test:create', () => {
  let writeFileSyncStub: sinon.SinonStub;

  afterEach(() => {
    $$.SANDBOX.restore();
  });

  test
    .do(() => {
      // emulate the component under test existing, but the corresponding test file does not
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml]))
        .returns(true)
        .withArgs(pathToFooTest)
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooJs])
    .it('outputs completed message on status code 0', (ctx) => {
      expect(ctx.stdout).to.contain('Test case successfully created');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in([pathToFooJs]))
        .returns(true)
        .withArgs(pathToFooTest)
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooJs])
    .it('creates test file in __tests__ folder of component bundle when .html file is missing', () => {
      expect(writeFileSyncStub.args[0][0]).to.equal(pathToFooTest);
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml]))
        .returns(true)
        .withArgs(pathToFooTest)
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooJs])
    .it('created test file has correct import statement', () => {
      expect(writeFileSyncStub.args[0][1]).to.contain("import Foo from 'c/foo';");
      expect(writeFileSyncStub.args[0][0]).to.equal(pathToFooTest);
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in([pathToFooBarJs, pathToFooBarHtml]))
        .returns(true)
        .withArgs(join('', 'path', 'to', 'js', '__tests__', 'fooBar.test.js'))
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooBarJs])
    .it('created test file has describe block with kebab-case', () => {
      expect(writeFileSyncStub.args[0][1]).to.contain("describe('c-foo-bar', () => {");
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync').withArgs(pathToFooJs).returns(false);
      (fs.existsSync as SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooJs])
    .it('logs error if file path does not point to existing file', (ctx) => {
      expect(ctx.stderr).to.contain('File not found');
    });

  test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in([pathToFooJs, pathToFooHtml, pathToFooTest]))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', pathToFooJs])
    .it('logs error if test file already exists', (ctx) => {
      expect(ctx.stderr).to.contain('Test file already exists');
    });
});
