import type { FileSystem } from './types';

interface NodeFS {
  readFile: (
    path: string,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
  ) => void;
}

let cachedFs: NodeFS | null = null;
let fsLoadPromise: Promise<NodeFS> | null = null;
let fsLoadError: string | null = null;

async function resolveFs(explicitFs?: NodeFS): Promise<NodeFS> {
  if (explicitFs) return explicitFs;
  if (cachedFs) return cachedFs;
  if (fsLoadError !== null) {
    throw new Error(
      `readFile - failed to load fs in nodejs environment with error: ${fsLoadError}`
    );
  }
  if (!fsLoadPromise) {
    fsLoadPromise = import('node:fs')
      .then(mod => {
        cachedFs = mod as unknown as NodeFS;
        return cachedFs;
      })
      .catch(err => {
        fsLoadError = err instanceof Error ? err.message : String(err);
        throw new Error(
          `readFile - failed to load fs in nodejs environment with error: ${fsLoadError}`
        );
      });
  }
  return fsLoadPromise;
}

export function createFileSystem(fs?: NodeFS): FileSystem {
  const readFile = (filePath: string): Promise<Buffer> =>
    resolveFs(fs).then(
      f =>
        new Promise<Buffer>((res, rej) => {
          f.readFile(filePath, (err, buffer) => (err ? rej(err) : res(buffer)));
        })
    );

  return { readFile };
}
