/**
 * File: source-middleware.ts
 * Description: 处理 JavaScript 文件的中间件
 * Created: 2021-06-19 20:44:22
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseContext, Next } from 'koa';
import { resolveModulePath } from '../resolve';
import { rewrite } from '../utils/rewrite';

export function createSourceMiddleware(workDir: string) {
  return async function(ctx: BaseContext, next: Next) {
    const sourcePath = ctx.path;

    // javascript package
    if (sourcePath.startsWith('/__modules/')) {
      const tmp = sourcePath.replace('/__modules/', '');
      const res = resolveModulePath(tmp, workDir);

      const content = await fs.readFile(res, {
        encoding: 'utf-8',
      });

      ctx.set('Content-Type', 'application/javascript');
      ctx.body = content;

    } else if (sourcePath.endsWith('.js')) {
      const filename = path.join(workDir, sourcePath.slice(1));
      try {
        const content = await fs.readFile(filename, {
          encoding: 'utf-8',
        });

        ctx.set('Content-Type', 'application/javascript');
        ctx.body = rewrite(content);
      } catch (e) {
        console.log(e);
      }
    } else {
      await next();
    }
  };
}
