import { readFile } from 'node:fs/promises'
import path from 'node:path'

const distDir = path.resolve('dist')
const strictNoindex = process.env.SEO_CHECK_STRICT_NOINDEX !== 'false'
const noindexMeta = '<meta name="robots" content="noindex,nofollow"'

const mustIndexRoutes = ['/', '/reporting-playbook/', '/legal/impressum/', '/legal/datenschutz/']
const mustNoindexRoutes = ['/reporting-beispiele/', '/reporting-playbook-gsap/']

function routeToDistFile(route) {
	if (route === '/') {
		return path.join(distDir, 'index.html')
	}
	return path.join(distDir, route.replace(/^\//, ''), 'index.html')
}

async function checkRoute(route, expectedNoindex) {
	const filePath = routeToDistFile(route)
	const html = await readFile(filePath, 'utf8')
	const hasNoindex = html.includes(noindexMeta)

	const pass = expectedNoindex ? hasNoindex : !hasNoindex
	return { route, filePath, expectedNoindex, hasNoindex, pass }
}

async function main() {
	const results = []

	for (const route of mustIndexRoutes) {
		results.push(await checkRoute(route, false))
	}

	if (strictNoindex) {
		for (const route of mustNoindexRoutes) {
			results.push(await checkRoute(route, true))
		}
	}

	let hasFailure = false
	for (const result of results) {
		if (result.pass) {
			console.log(`[PASS] ${result.route} (${result.filePath})`)
			continue
		}

		hasFailure = true
		if (result.expectedNoindex) {
			console.error(
				`[FAIL] ${result.route} must include noindex,nofollow but it is missing (${result.filePath})`
			)
		} else {
			console.error(
				`[FAIL] ${result.route} must remain indexable but contains noindex,nofollow (${result.filePath})`
			)
		}
	}

	if (hasFailure) {
		process.exitCode = 1
		return
	}

	if (!strictNoindex) {
		console.log('[INFO] Strict noindex checks are disabled (SEO_CHECK_STRICT_NOINDEX=false).')
	}
	console.log('[OK] SEO indexing policy checks passed.')
}

main().catch((error) => {
	console.error('[ERROR] SEO indexing policy check failed.', error)
	process.exitCode = 1
})
