import { expect, test } from '@salesforce/command/lib/test';
import Run from '../../../../src/commands/lwc/test/run';
import { testSetup } from '@salesforce/core/lib/testSetup';
import { stubMethod } from '@salesforce/ts-sinon';

// Mock all things in core, like api, file io, etc.
const $$ = testSetup();

describe('lwc:test:run', () => {
  test
    .do(() => {
      stubMethod($$.SANDBOX, Run.prototype, 'runJest').returns({ status: 0 });
    })
    .stdout()
    .withProject()
    .command(['lwc:test:run'])
    .it('runs lwc:test:run', ctx => {
      expect(ctx.stdout).to.contain('Test run complete. Exited with status code: 0');
    });
});
