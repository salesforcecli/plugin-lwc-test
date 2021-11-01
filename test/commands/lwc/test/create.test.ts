/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import * as fs from 'fs';
import * as sinon from 'sinon';
import { SinonStub } from "sinon";
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

describe('force:lightning:lwc:test:create', () => {
  let writeFileSyncStub;

  afterEach(() => {
    $$.SANDBOX.restore();
  });

  test
    .do(() => {
      // emulate the component under test existing, but the corresponding test file does not
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in(['/path/to/js/foo.js', '/path/to/js/foo.html']))
        .returns(true)
        .withArgs('/path/to/js/__tests__/foo.test.js')
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
    .it('outputs completed message on status code 0', ctx => {
      expect(ctx.stdout).to.contain('Test case successfully created');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in(['/path/to/js/foo.js', '/path/to/js/foo.html']))
        .returns(true)
        .withArgs('/path/to/js/__tests__/foo.test.js')
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
    .it('creates test file in __tests__ folder of component bundle', ctx => {
      expect(writeFileSyncStub.args[0][0]).to.equal('/path/to/js/__tests__/foo.test.js');
    });

    test
      .do(() => {
        stubMethod($$.SANDBOX, fs, 'existsSync')
          .withArgs(sinon.match.in(['/path/to/js/foo.js']))
          .returns(true)
          .withArgs('/path/to/js/__tests__/foo.test.js')
          .returns(false);
        (fs.existsSync as SinonStub).callThrough();
        stubMethod($$.SANDBOX, fs, 'mkdirSync');
        writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
      })
      .stdout()
      .withProject()
      .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
      .it('creates test file in __tests__ folder of component bundle when .html file is missing', ctx => {
        expect(writeFileSyncStub.args[0][0]).to.equal('/path/to/js/__tests__/foo.test.js');
      });

    test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in(['/path/to/js/foo.js', '/path/to/js/foo.html']))
        .returns(true)
        .withArgs('/path/to/js/__tests__/foo.test.js')
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
    .it('created test file has correct import statement', ctx => {
      expect(writeFileSyncStub.args[0][1]).to.contain("import Foo from 'c/foo';");
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in(['/path/to/js/fooBar.js', '/path/to/js/fooBar.html']))
        .returns(true)
        .withArgs('/path/to/js/__tests__/fooBar.test.js')
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
      stubMethod($$.SANDBOX, fs, 'mkdirSync');
      writeFileSyncStub = stubMethod($$.SANDBOX, fs, 'writeFileSync');
    })
    .stdout()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/fooBar.js'])
    .it('created test file has describe block with kebab-case', ctx => {
      expect(writeFileSyncStub.args[0][1]).to.contain("describe('c-foo-bar', () => {");
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs('/path/to/js/foo.js')
        .returns(false);
      (fs.existsSync as SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
    .it('logs error if file path does not point to existing file', ctx => {
      expect(ctx.stderr).to.contain('File not found');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, fs, 'existsSync')
        .withArgs(sinon.match.in(['/path/to/js/foo.js', '/path/to/js/foo.html', '/path/to/js/__tests__/foo.test.js']))
        .returns(true);
      (fs.existsSync as SinonStub).callThrough();
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['force:lightning:lwc:test:create', '-f', '/path/to/js/foo.js'])
    .it('logs error if test file already exists', ctx => {
      expect(ctx.stderr).to.contain('Test file already exists');
    });
});
