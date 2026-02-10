import { spawn } from 'node:child_process'

const runCommand = (command, args, env = process.env) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			env
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

const main = async () => {
	await runCommand('npm', ['run', 'build'])
	await runCommand('npm', ['run', '-s', 'seo:check-indexing'], {
		...process.env,
		SEO_CHECK_MODE: process.env.SEO_CHECK_MODE || 'source'
	})
}

main().catch((error) => {
	console.error('[ERROR] release:check failed', error)
	process.exitCode = 1
})
