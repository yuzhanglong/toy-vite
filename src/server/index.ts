import * as Koa from 'koa';
import * as path from 'path';
import * as fs from 'fs';
import * as serveStatic from 'koa-static';
import { BaseContext, Next } from 'koa';


function getClientCode() {
  const clientCodePath = path.resolve(__dirname, '../client/index.js');
  const hmrClientCode = fs.readFileSync(clientCodePath);
  return hmrClientCode.toString();
}

function createHmrMiddleware() {
  const hmrClientCode = getClientCode();
  return async function(ctx: BaseContext, next: Next) {
    const { path } = ctx;
    if (path === '/__hmrClient') {
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

  // hmr client
  app.use(createHmrMiddleware());

  // file server
  app.use(createFileServerMiddleware(workingDir));

  // listening...
  app.listen(port, () => {
    console.log(`the server is running on http://localhost:${port}`);
  });
}

createServer(3000)
  .catch(e => {
    console.log(e);
  });
