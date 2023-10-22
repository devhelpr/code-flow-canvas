import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';
import { python } from 'https://deno.land/x/python/mod.ts';

const router = new Router();

router.get('/', (ctx) => {
  ctx.response.redirect('/api');
});

router.get('/api', (ctx) => {
  ctx.response.body = { message: 'Hello vps-api' };
  ctx.response.type = 'text/json';
});

router.get('/test', async (ctx) => {
  // run shell command and retrieve output from stdout
  const p = Deno.run({
    cmd: ['echo', 'abcd'],
    stdout: 'piped',
    stderr: 'piped',
  });
  await p.status();
  const output = new TextDecoder().decode(await p.output()).trim();
  console.log('test', output);
  ctx.response.body = { message: output };
  ctx.response.type = 'text/json';
});

router.get('/python', (ctx, done) => {
  const np = python.import('numpy');
  const plt = python.import('matplotlib.pyplot');
  const base64 = python.import('base64');
  const io = python.import('io');
  const fig = plt.figure();
  const xpoints = np.array([1, 8]);
  const ypoints = np.array([3, 10]);

  plt.plot(xpoints, ypoints);

  const tmpfile = io.BytesIO();
  fig.savefig(tmpfile); // "format= 'png'")
  const encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8');
  ctx.response.body = { image: encoded.toString() };
  ctx.response.type = 'text/json';
});

const app = new Application();

app.addEventListener('listen', ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? 'https://' : 'http://'}${
      hostname ?? 'localhost'
    }:${port}`
  );
});

app.use(
  oakCors({
    origin: 'http://localhost:4200',
  })
);

app.use(router.routes());
app.use(router.allowedMethods());

await app
  .listen({ port: Number(Deno.env.get('PORT') || 3000) })
  .catch((err) => {
    console.error('Error serving app. Original Error:', err);
  });
