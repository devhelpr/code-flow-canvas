export function onRequest(context) {
  const response = new Response('Hello, world!');

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,HEAD,POST,PUT,OPTIONS'
  );
  return response;
}
