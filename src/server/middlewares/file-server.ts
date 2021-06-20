/**
 * File: file-server.ts
 * Description: 文件服务器中间件
 * Created: 2021-06-20 22:37:13
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */


import * as serveStatic from 'koa-static';


export function createFileServerMiddleware(workdir: string) {
  return serveStatic(workdir);
}
