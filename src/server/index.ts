import * as Koa from 'koa';
import * as path from 'path';
import * as serveStatic from 'koa-static';
import { BaseContext, Next } from 'koa';
import * as WebSocket from 'ws';
import * as http from 'http';
import { Server } from 'http';
import * as chokidar from 'chokidar';
import { rewrite } from './rewrite';
import { promises as fs } from 'fs';
import { resolveModulePath } from './resolve';

async function getClientCode() {
  const clientCodePath = path.resolve(__dirname, '../client/index.js');
  return await fs.readFile(clientCodePath, {
    encoding: 'utf-8',
  });
}

async function createHmrMiddleware(cwd: string, server: Server) {
  const hmrClientCode = await getClientCode();
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

function createSourceMiddleware(workDir: string) {
  return async function(ctx: BaseContext, next: Next) {
    // js package
    const sourcePath = ctx.path;

    //  js file
    if (sourcePath.startsWith('/__modules/')) {
      const res = resolveModulePath(sourcePath.replace('/__modules/', ''), workDir);
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


export async function createServer(port: number, workingDir: string = process.cwd()) {
  const app = new Koa();

  const server = http.createServer(app.callback());

  // hmr client
  app.use(await createHmrMiddleware(workingDir, server));

  // js file
  app.use(createSourceMiddleware(workingDir));

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
