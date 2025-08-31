import type { FileSystem } from './types';

interface NodeFS {
  readFile: (
    path: string,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
  ) => void;
}

export function createFileSystem(fs?: NodeFS): FileSystem {
  let requireFsError = '';

  if (!fs) {
    try {
      fs = require('node:fs');
    } catch (err) {
      requireFsError = err.toString();
    }
  }

  const readFile = fs
    ? (filePath: string) =>
        new Promise<Buffer>((res, rej) => {
          fs.readFile(filePath, (err: NodeJS.ErrnoException | null, buffer: Buffer) =>
            err ? rej(err) : res(buffer)
          );
        })
    : () => {
        throw new Error(
          `readFile - failed to require fs in nodejs environment with error: ${requireFsError}`
        );
      };

  return {
    readFile,
  };
}
