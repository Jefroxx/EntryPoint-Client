// The test site: this PC's code, built, served at https://test.entrypoint.digital through a Cloudflare tunnel.
//   npm run test-site:build   builds into .nuxt-test / .output-test (a running `npm run dev` is not touched)
//   npm run test-site:start   serves that build on http://localhost:3100 (the tunnel points there)
// The browser talks to /api on the same address and the server forwards it to Laravel on 127.0.0.1:8000,
// so `php artisan serve` must be running too.
import { spawn } from 'node:child_process'

const mode = process.argv[2]
const env = { ...process.env, ENTRYPOINT_TEST_SITE: '1', NUXT_PUBLIC_API_BASE_URL: '/api' }

const [cmd, args] = mode === 'build'
	? ['npx', ['nuxt', 'build']]
	: mode === 'start'
		? ['node', ['.output-test/server/index.mjs']]
		: [null, null]

if (!cmd) {
	console.error('Usage: node scripts/test-site.mjs build|start')
	process.exit(1)
}
if (mode === 'start') env.PORT = env.PORT || '3100'

const child = spawn(cmd, args, { env, stdio: 'inherit', shell: process.platform === 'win32' })
child.on('exit', (code) => process.exit(code ?? 0))
