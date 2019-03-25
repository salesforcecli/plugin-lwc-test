import * as fs from 'fs';
import * as child_process from 'child_process';
import * as sinon from 'sinon';
import { expect, test } from '@salesforce/command/lib/test';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

describe('lwc:test:create', () => {

  describe('without proper environment', () => {
    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync')
        .withArgs('node', sinon.match.any)
        .returns({ status: 9009 }); // the exit code Windows VM gives with no Node installed
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['lwc:test:setup'])
    .it('logs error when node returns non-zero exit code', ctx => {
      expect(ctx.stderr).to.contain('Could not retrieve Node version');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync').callsFake(cmd => {
        if (cmd === 'node') {
          return { status: 0, stdout: 'v6.17.0' };
        }
      });
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['lwc:test:setup'])
    .it('logs error when node version is too low', ctx => {
      expect(ctx.stderr).to.contain('Node version too low');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync').callsFake(cmd => {
        if (cmd === 'node') {
          return { status: 0, stdout: 'v8.12.0' };
        }
        if (cmd === 'npm') {
          return { status: 9009 };
        }
      });
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['lwc:test:setup'])
    .it('logs error when npm returns non-zero exit code', ctx => {
      expect(ctx.stderr).to.contain('npm command not found');
    });

    test
    .do(() => {
      stubMethod($$.SANDBOX, child_process, 'spawnSync').callsFake(cmd => {
        if (cmd === 'node') {
          return { status: 0, stdout: 'v8.12.0' };
        }
        if (cmd === 'npm') {
          return { status: 0 };
        }
      });
    })
    .stdout()
    .stderr()
    .withProject()
    .command(['lwc:test:setup'])
    .it('logs error no package.json present', ctx => {
      expect(ctx.stderr).to.contain('No package.json found at root of project');
    });
  });

  describe('package.json', () => {
    // test
    // .do(() => {
    //   stubMethod($$.SANDBOX, child_process, 'spawnSync').callsFake(cmd => {
    //     if (cmd === 'node') {
    //       return { status: 0, stdout: 'v8.12.0' };
    //     }
    //     if (cmd === 'npm') {
    //       return { status: 0 };
    //     }
    //   });
    //   stubMethod($$.SANDBOX, fs, 'existsSync').returns(true);
    // })
    // .stdout()
    // .stderr()
    // .withProject()
    // .command(['lwc:test:setup'])
    // .it('with no test scripts adds scripts to package.json', ctx => {
    //   expect(ctx.stderr).to.contain('No package.json found at root of project');
    // });

  });

});
