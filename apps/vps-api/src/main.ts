import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';
import { python } from 'https://deno.land/x/python/mod.ts';
import { getHtmlFromOpenAI } from './html-from-api.ts';

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

router.post('/python', async (ctx, done) => {
  const np = python.import('numpy');
  const plt = python.import('matplotlib.pyplot');
  const base64 = python.import('base64');
  const io = python.import('io');
  const fig = plt.figure();
  const ax = fig.subplots();
  const reqBody = JSON.parse(await ctx.request.body().value);
  console.log('body', reqBody, Array.isArray(reqBody), typeof reqBody);
  if (Array.isArray(reqBody)) {
    const xpoints = np.array([...reqBody.map((x: any, index) => index + 1)]);
    const ypoints = np.array([...reqBody.map((x: any) => x)]);

    ax.plot(xpoints, ypoints);
  } else {
    throw new Error('reqBody is not an array');
  }
  const tmpfile = io.BytesIO();
  fig.savefig(tmpfile); // "format= 'png'")
  const encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8');
  ctx.response.body = { image: encoded.toString() };
  ctx.response.type = 'text/json';

  // ctx.response.body = { image: '' };
  // ctx.response.type = 'text/json';
});

router.post('/create-ui', async (ctx) => {
  const apiKey = Deno.env.get('OPEN_API_KEY');
  console.log('apiKey', apiKey);
  const json = await ctx.request.body().value;
  console.log('json', json);
  const message = json.message;
  if (!message) {
    ctx.response.status = 500;
    ctx.response.body = { message: 'error: no message provided' };
    ctx.response.type = 'text/json';
    return;
  }
  console.log('message', message);
  const outputJson: any = await getHtmlFromOpenAI({
    message: message,
    apiKey: apiKey!,
  });
  console.log(outputJson);

  if (outputJson.error) {
    ctx.response.status = 500;
    ctx.response.body = { message: 'error generation HTML' };
    ctx.response.type = 'text/json';
    return;
  }

  let html = outputJson.choices[0].message.content;
  if (html.startsWith('```html')) {
    html = html.slice(7, -3).trim();
  }

  ctx.response.body = { message: html };
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
