// Stand-in for Supabase's API gateway: http://127.0.0.1:54321/{auth,rest}/v1/* -> GoTrue / PostgREST.
import http from 'node:http'

const routes = { '/auth/v1': Number(process.env.AUTH_PORT ?? 59999), '/rest/v1': Number(process.env.REST_PORT ?? 53000) }
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer, range, accept-profile, content-profile, x-supabase-api-version',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'access-control-expose-headers': 'content-range, x-total-count',
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  const prefix = Object.keys(routes).find((p) => req.url.startsWith(p))
  if (!prefix) { res.writeHead(501, { ...cors, 'content-type': 'application/json' }); return res.end('{"message":"not part of the test stack"}') }
  const upstream = http.request(
    { host: '127.0.0.1', port: routes[prefix], path: req.url.slice(prefix.length) || '/', method: req.method, headers: { ...req.headers, host: '127.0.0.1' } },
    (r) => {
      const headers = Object.fromEntries(Object.entries(r.headers).filter(([k]) => !k.startsWith('access-control-')))
      res.writeHead(r.statusCode, { ...headers, ...cors })
      r.pipe(res)
    },
  )
  upstream.on('error', (e) => { res.writeHead(502, cors); res.end(String(e)) })
  req.pipe(upstream)
}).listen(Number(process.env.PORT ?? 54321), '127.0.0.1', () => console.log('gateway on http://127.0.0.1:54321'))
