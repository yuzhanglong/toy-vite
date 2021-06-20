/**
 * File: hmr-middleware.ts
 * Description: hmr 中间件
 * Created: 2021-06-19 20:30:24
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */


import { Server } from 'http';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as WebSocket from 'ws';
import * as chokidar from 'chokidar';
import { BaseContext, Next } from 'koa';


/**
 * 获取 hmr 客户端代码文本
 *
 * @author yuzhanglong
 * @date 2021-06-19 20:36:00
 */
async function getClientCode() {
  const clientCodePath = path.resolve(__dirname, '../../client/index.js');
  return await fs.readFile(clientCodePath, {
    encoding: 'utf-8',
  });
}

/**
 * 创建 hmr koa 中间件
 *
 * @author yuzhanglong
 * @date 2021-06-19 20:39:09
 * @param cwd 工作根目录
 * @param server http server 实例
 * @return 对应的中间件函数
 */
export async function createHmrMiddleware(cwd: string, server: Server) {
  // 客户端代码
  const hmrClientCode = await getClientCode();

  // webSocket 实例
  let socket: WebSocket = null;

  const wss = new WebSocket.Server({
    server: server,
  });

  wss.on('connection', (ws) => {
    socket = ws;
    socket.send(JSON.stringify({ type: 'connected' }));
  });

  wss.on('error', (e: Error) => {
    console.error(e);
  });

  // 文件监听功能初始化
  const watcher = chokidar.watch(cwd, {
    ignored: [/node_modules/],
  });

  watcher.on('change', async () => {
    const send = (payload: any) => {
      console.log(`[toy-vite-hmr] ${JSON.stringify(payload)}`);
      socket.send(JSON.stringify(payload));
    };

    send({
      type: 'full-reload',
    });
  });

  return async function(ctx: BaseContext, next: Next) {
    const { path } = ctx;
    if (path === '/hmr-client.js') {
      ctx.set('Content-Type', 'application/javascript');
      ctx.body = hmrClientCode;
    } else {
      await next();
    }
  };
}
