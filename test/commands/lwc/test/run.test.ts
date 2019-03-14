import { expect, test } from '@salesforce/command/dist/test';

describe('lwc:test:run', () => {
  test
    .command(['lwc:test:run'])
    .it('runs lwc:test:run', ctx => {
      expect(ctx.stdout).to.contain('foo');
    });
});
