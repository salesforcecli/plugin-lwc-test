/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import signalExit = require('signal-exit');

type WriteQueueItem = {
  filepath: string;
  content: string | Uint8Array;
  options?: fs.WriteFileOptions;
}

type AppendQueueItem = {
  filepath: string;
  toAppend: string | Uint8Array;
  options?: fs.WriteFileOptions;
}

export class FileWriter {
  /*
   * Queue of files to write. May be a new file or replace an existing one.
   */
  private writeQueue: WriteQueueItem[] = [];

  /*
   * Queue of files to append data to.
   */
  private appendQueue: AppendQueueItem[] = [];

  /*
   * An object mapping filenames to their temporary copy. We use the temp copy to
   * save a copy of the original file in case of any unexpected early termination of the run. If an error does
   * occur, all previous files that were modified are replaced with the
   * original content saved to the temp file.
   */
  private tmpFilelist = {};

  /*
   * Save references to new files created so that if we need to revert back to our original state we know to remove these.
   */
  private newFiles: string[] = [];

  public constructor() {
    // nothing to construct
  }

  public queueWrite(filepath: string, content: string, options?: fs.WriteFileOptions): void {
    this.writeQueue.push({
      filepath,
      content,
      options,
    });
  }

  public queueAppend(filepath: string, toAppend: string, options?: fs.WriteFileOptions): void {
    this.appendQueue.push({
      filepath,
      toAppend,
      options,
    });
  }

  public writeFiles(): void {
    const cleanup = this.revertChanges();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const removeExitHandler = signalExit(cleanup);
    try {
      this.appendQueue.forEach(
        (item: { filepath: string; toAppend: string | Uint8Array; options: fs.WriteFileOptions }) => {
          const tmpFilename = item.filepath + '.' + this.getHash(item.filepath);
          if (!fs.existsSync(item.filepath)) {
            throw new Error('Attempting to append to file that does not exist: ' + item.filepath);
          }
          fs.copyFileSync(item.filepath, tmpFilename);
          this.tmpFilelist[item.filepath] = tmpFilename;
          fs.appendFileSync(item.filepath, item.toAppend, item.options);
        }
      );

      this.writeQueue.forEach(
        (item: { filepath: string; content: string | Uint8Array; options: fs.WriteFileOptions }) => {
          const tmpFilename = item.filepath + '.' + this.getHash(item.filepath);
          if (fs.existsSync(item.filepath)) {
            fs.copyFileSync(item.filepath, tmpFilename);
            this.tmpFilelist[item.filepath] = tmpFilename;
          } else {
            this.newFiles.push(item.filepath);
          }
          fs.writeFileSync(item.filepath, item.content, item.options);
        }
      );
      // things worked fine so remove handler and only remove temp files
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      removeExitHandler();
      this.removeTempFiles();
    } catch (e) {
      // TODO(tbliss): how to get access to the same logger that the commands have?
      // eslint-disable-next-line no-console
      console.log('Error writing files. Attempting to revert back to original state.');
      // eslint-disable-next-line no-console
      console.log(e);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      removeExitHandler();
      cleanup();
    }
  }

  private revertChanges(): () => void {
    return (): void => {
      // replace original files with temp backups
      Object.keys(this.tmpFilelist).forEach((item) => {
        fs.copyFileSync(this.tmpFilelist[item], item);
      });

      this.newFiles.forEach((file) => {
        fs.unlinkSync(file);
      });

      this.removeTempFiles();
    };
  }

  private removeTempFiles(): void {
    Object.keys(this.tmpFilelist).forEach((item) => {
      fs.unlinkSync(this.tmpFilelist[item]);
    });
  }

  private getHash(filename: string): string {
    return crypto.createHash('md5').update(filename, 'utf8').update(String(process.pid), 'utf8').digest('hex');
  }
}
