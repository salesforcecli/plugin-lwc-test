import { core, flags, SfdxCommand } from '@salesforce/command';
import * as path from 'path';
import * as fs from 'fs';
import { spawnSync } from 'child_process';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-lwc-test', 'setup');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx force:lightning:lwc:test:install`
  ];

  protected static requiresProject = true;

  getProjectRoot(): string {
    return process.cwd();
  }

  public async run(): Promise<void> {
    /**
     * - Check for Node version
     * - Create package.json at project root if not available
     * - @salesforce/lwc-jest added as devDependency
     *  - verify what happens if already installed?
     * - .forceignore updated
     * ...
     */
    const forceignoreEntry = '# LWC Jest tests\n**/__tests__/**';

    const nodeVersionRet = spawnSync('node', ['-v']);
    if (nodeVersionRet.error) {
      throw new core.SfdxError(messages.getMessage('errorNodeNotFound'));
    }
    const nodeVersion = nodeVersionRet.stdout.slice(1); // strip the v from v8.12.0
    if (nodeVersion < "8.12.0") {
      throw new core.SfdxError(messages.getMessage('errorNodeVersion', [nodeVersion]));
    }

    const npmVersionRet = spawnSync('npm', ['-v']);
    if (npmVersionRet.error) {
      throw new core.SfdxError(messages.getMessage('errorNpmNotFound'));
    }

    // TODO(tbliss): add logic here to make sure we're in project root or find project root
    const packageJsonPath = path.join(this.getProjectRoot(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      // we could run 'npm init' or create package.json ourselves
      throw new core.SfdxError(messages.getMessage('errorNoPackageJson'));
    }

    this.ux.log('Installing @salesforce/lwc-jest node package...');
    //const lwcJestInstallRet = spawnSync('npm', ['add', '--save-dev', '@salesforce/lwc-jest'], { stdio: "inherit" });
    // if (lwcJestInstallRet.error) {
    //   throw new core.SfdxError(messages.getMessage('errorLwcJestInstall', [lwcJestInstallRet.error]));
    // }

    const forceignorePath = path.join(this.getProjectRoot(), '.forceignore');
    if (!fs.existsSync(forceignorePath)) {
      this.ux.log('Creating missing .forceignore file found in the project root...');
      fs.writeFileSync(forceignorePath, forceignoreEntry);
    } else {
      const forceignore = fs.readFileSync(forceignorePath, { encoding: 'utf8' });
      if (forceignore.indexOf('**/__tests__/**') === -1) {
        this.ux.log('No "**/__tests__/** entry found in .forceignore. Adding now...');
        fs.appendFileSync(forceignorePath, forceignoreEntry,{ encoding: 'utf8' });
      }
    }

  }
}
