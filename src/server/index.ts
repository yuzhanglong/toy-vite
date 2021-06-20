import * as http from 'http';
import * as Koa from 'koa';
import { createHmrMiddleware } from './middlewares/hmr-middleware';
import { createSourceMiddleware } from './middlewares/source-middleware';
import { createFileServerMiddleware } from './middlewares/file-server';


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
