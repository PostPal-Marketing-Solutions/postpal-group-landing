const strictNoindex = process.env.SEO_CHECK_STRICT_NOINDEX !== 'false'
const noindexMeta = '<meta name="robots" content="noindex,nofollow"'
const baseUrl = process.env.SEO_CHECK_BASE_URL || 'http://localhost:4321'

const mustIndexRoutes = ['/', '/reporting-playbook/', '/legal/impressum/', '/legal/datenschutz/']
const mustNoindexRoutes = ['/reporting-beispiele/', '/reporting-playbook-gsap/']

const normalizeBaseUrl = (input) => {
	try {
		const url = new URL(input)
		url.pathname = '/'
		url.search = ''
		url.hash = ''
		return url
	} catch {
		throw new Error(`Invalid SEO_CHECK_BASE_URL: ${input}`)
	}
}

const buildRouteUrl = (base, route) => {
	const normalizedRoute = route.startsWith('/') ? route.slice(1) : route
	return new URL(normalizedRoute, base).toString()
}

async function checkRoute(base, route, expectedNoindex) {
	const targetUrl = buildRouteUrl(base, route)
	const response = await fetch(targetUrl, {
		redirect: 'follow',
		headers: {
			'User-Agent': 'postpal-seo-check/1.0'
		}
	})

	if (!response.ok) {
		return {
			route,
			targetUrl,
			expectedNoindex,
			hasNoindex: null,
			pass: false,
			error: `HTTP ${response.status}`
		}
	}

	const html = await response.text()
	const hasNoindex = html.includes(noindexMeta)
	const pass = expectedNoindex ? hasNoindex : !hasNoindex

	return {
		route,
		targetUrl,
		expectedNoindex,
		hasNoindex,
		pass,
		error: null
	}
}

async function main() {
	const normalizedBase = normalizeBaseUrl(baseUrl)
	const results = []

	for (const route of mustIndexRoutes) {
		results.push(await checkRoute(normalizedBase, route, false))
	}

	if (strictNoindex) {
		for (const route of mustNoindexRoutes) {
			results.push(await checkRoute(normalizedBase, route, true))
		}
	}

	let hasFailure = false
	for (const result of results) {
		if (result.pass) {
			console.log(`[PASS] ${result.route} (${result.targetUrl})`)
			continue
		}

		hasFailure = true
		if (result.error) {
			console.error(`[FAIL] ${result.route} request failed: ${result.error} (${result.targetUrl})`)
			continue
		}

		if (result.expectedNoindex) {
			console.error(`[FAIL] ${result.route} must include noindex,nofollow but it is missing (${result.targetUrl})`)
		} else {
			console.error(`[FAIL] ${result.route} must remain indexable but contains noindex,nofollow (${result.targetUrl})`)
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
	const connectionErrorCode = error?.cause?.code
	const isFetchConnectionFailure =
		connectionErrorCode === 'ECONNREFUSED' ||
		connectionErrorCode === 'ENOTFOUND' ||
		connectionErrorCode === 'EHOSTUNREACH' ||
		(error instanceof TypeError && error.message.toLowerCase().includes('fetch failed'))
	if (isFetchConnectionFailure) {
		console.error('[HINT] Start `npm run dev` or set SEO_CHECK_BASE_URL to a reachable host.')
		console.error(`[HINT] Current base URL: ${baseUrl}`)
	}
	process.exitCode = 1
})
