import * as path from 'path';
import { buildSync } from 'esbuild';

const moduleNameToCachePathMap = new Map();

export function resolveModulePath(id: string, workDir: string): string {
  let modulePath: string;
  try {
    const isScopedModule = id.startsWith('@');
    const tmp = id.split('/');
    const moduleBaseName = tmp.slice(0, isScopedModule ? 2 : 1).join('/');

    if (!moduleNameToCachePathMap.has(moduleBaseName)) {
      const target = path.resolve(workDir, '.cache', `${moduleBaseName}.js`);

      buildSync({
        entryPoints: [moduleBaseName],
        bundle: true,
        outfile: target,
        format: 'esm',
      });

      modulePath = target;
      moduleNameToCachePathMap.set(moduleBaseName, target);
    } else {
      modulePath = moduleNameToCachePathMap.get(moduleBaseName);
    }
  } catch (e) {
    console.log(e);
  }

  return modulePath;
}
