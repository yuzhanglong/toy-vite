import * as Koa from 'koa';
import * as path from 'path';
import * as fs from 'fs';
import * as serveStatic from 'koa-static';
import { BaseContext, Next } from 'koa';
import * as WebSocket from 'ws';
import * as http from 'http';
import { Server } from 'http';
import * as chokidar from 'chokidar';

function getClientCode() {
  const clientCodePath = path.resolve(__dirname, '../client/index.js');
  const hmrClientCode = fs.readFileSync(clientCodePath);
  return hmrClientCode.toString();
}

function createHmrMiddleware(cwd: string, server: Server) {
  const hmrClientCode = getClientCode();
  let socket: WebSocket = null;

  // websocket support
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

  // file watcher support
  const watcher = chokidar.watch(cwd, {
    ignored: [/node_modules/],
  });

  watcher.on('change', async (file: string) => {
    console.log(file);

    const send = (payload: any) => {
      console.log(`[hmr] ${JSON.stringify(payload)}`);
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

function createFileServerMiddleware(workdir: string) {
  return serveStatic(workdir);
}


export async function createServer(port: number, workingDir: string = process.cwd()) {
  const app = new Koa();

  const server = http.createServer(app.callback());

  // hmr client
  app.use(createHmrMiddleware(workingDir, server));

  // file server
  app.use(createFileServerMiddleware(workingDir));

  // listening...
  server.listen(port, () => {
    console.log(`the server is running on http://localhost:${port}`);
  });
}

createServer(3000)
  .catch(e => {
    console.log(e);
  });
