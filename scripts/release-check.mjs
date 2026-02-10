import { spawn } from 'node:child_process'

const PREVIEW_HOST = '127.0.0.1'
const PREVIEW_PORT = '4321'
const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`

const runCommand = (command, args, options = {}) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			env: process.env,
			...options
		})

		child.on('error', reject)
		child.on('exit', (code) => {
			if (code === 0) {
				resolve()
				return
			}
			reject(new Error(`Command failed (${command} ${args.join(' ')}), exit code ${code}`))
		})
	})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForPreview = async () => {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		try {
			const response = await fetch(`${PREVIEW_URL}/`)
			if (response.ok) {
				return
			}
		} catch {
			// Keep waiting until timeout.
		}
		await sleep(500)
	}

	throw new Error(`Preview server did not become ready at ${PREVIEW_URL}`)
}

const stopProcess = (child) =>
	new Promise((resolve) => {
		if (child.killed || child.exitCode !== null) {
			resolve()
			return
		}

		child.once('exit', () => resolve())
		child.kill('SIGTERM')
		setTimeout(() => {
			if (child.exitCode === null) {
				child.kill('SIGKILL')
			}
		}, 2000)
	})

const main = async () => {
	await runCommand('npm', ['run', 'build'])

	const preview = spawn('npm', ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', PREVIEW_PORT], {
		stdio: 'inherit',
		env: process.env
	})

	try {
		await waitForPreview()

		await runCommand('npm', ['run', '-s', 'seo:check-indexing'], {
			env: {
				...process.env,
				SEO_CHECK_MODE: 'http',
				SEO_CHECK_BASE_URL: PREVIEW_URL
			}
		})
	} finally {
		await stopProcess(preview)
	}
}

main().catch((error) => {
	console.error('[ERROR] release:check failed', error)
	process.exitCode = 1
})
