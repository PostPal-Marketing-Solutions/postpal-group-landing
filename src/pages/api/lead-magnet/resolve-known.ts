import type { APIRoute } from 'astro'
import { findByToken, normalizeFirstName, normalizeToken } from '../../../lib/server/airtable'

export const prerender = false

const json = (payload: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	})

export const GET: APIRoute = async ({ url }) => {
	const token = normalizeToken(url.searchParams.get('token'))
	const fallbackFirstName = normalizeFirstName(url.searchParams.get('firstname')) || ''

	if (!token) {
		return json(
			{
				ok: false,
				error: 'Missing or invalid token',
				known: false,
				tokenMatched: false,
				name: fallbackFirstName,
				leadRecordId: null
			},
			400
		)
	}

	try {
		const match = await findByToken(token)
		return json({
			ok: true,
			known: true,
			tokenMatched: match.tokenMatched,
			name: match.firstName || fallbackFirstName,
			leadRecordId: match.recordId,
			token
		})
	} catch (error) {
		console.error('[lead-magnet/resolve-known] Lookup failed', error)
		return json(
			{
				ok: false,
				error: 'Unable to resolve known lead',
				known: true,
				tokenMatched: false,
				name: fallbackFirstName,
				leadRecordId: null,
				token
			},
			500
		)
	}
}
