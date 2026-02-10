import type { APIRoute } from 'astro'
import {
	buildLeadFields,
	createLead,
	deriveLeadSource,
	deriveNameFromEmail,
	findByToken,
	normalizeEmail,
	normalizeFirstName,
	normalizeLeadSource,
	normalizeToken,
	updateLead
} from '../../../lib/server/airtable'

export const prerender = false

type CaptureBody = {
	email?: unknown
	consent_marketing?: unknown
	lead_source?: unknown
	asset_id?: unknown
	utm_source?: unknown
	utm_medium?: unknown
	utm_campaign?: unknown
	utm_content?: unknown
	ts_submitted?: unknown
	token?: unknown
	name?: unknown
	flow_type?: unknown
	state_requested?: unknown
	page_path?: unknown
}

const json = (payload: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	})

const parseBody = async (request: Request): Promise<CaptureBody> => {
	try {
		const parsed = await request.json()
		return typeof parsed === 'object' && parsed !== null ? (parsed as CaptureBody) : {}
	} catch {
		return {}
	}
}

export const POST: APIRoute = async ({ request }) => {
	const body = await parseBody(request)
	const email = normalizeEmail(body.email)

	if (!email) {
		return json({ ok: false, error: 'Invalid email' }, 400)
	}

	const token = normalizeToken(body.token)
	const firstName = normalizeFirstName(body.name)
	const leadSource =
		normalizeLeadSource(body.lead_source) ||
		deriveLeadSource({
			token,
			utmSource: body.utm_source,
			utmMedium: body.utm_medium
		})
	const flowType = body.flow_type || (token ? 'known' : 'gated')
	const nowIso = new Date().toISOString()
	const fallbackName = !token && !firstName ? deriveNameFromEmail(email) : undefined

	try {
		if (token) {
			const match = await findByToken(token)
			const sharedFields = buildLeadFields({
				email,
				token,
				firstName,
				consentMarketing: body.consent_marketing,
				leadSource,
				assetId: body.asset_id,
				utmSource: body.utm_source,
				utmMedium: body.utm_medium,
				utmCampaign: body.utm_campaign,
				utmContent: body.utm_content,
				tsSubmitted: body.ts_submitted || nowIso,
				flowType,
				stateRequested: body.state_requested,
				tokenMatchStatus: match.tokenMatched ? 'matched' : 'unmatched',
				pagePath: body.page_path,
				lastSeenAt: nowIso
			})

			if (match.recordId && match.tokenMatched) {
				const updated = await updateLead(match.recordId, sharedFields)
				return json({
					ok: true,
					leadRecordId: updated.recordId,
					tokenMatched: true,
					state: 'submitted'
				})
			}

			const created = await createLead(sharedFields)
			return json({
				ok: true,
				leadRecordId: created.recordId,
				tokenMatched: false,
				state: 'submitted'
			})
		}

		const created = await createLead(
			buildLeadFields({
				email,
				firstName: firstName || fallbackName,
				consentMarketing: body.consent_marketing,
				leadSource,
				assetId: body.asset_id,
				utmSource: body.utm_source,
				utmMedium: body.utm_medium,
				utmCampaign: body.utm_campaign,
				utmContent: body.utm_content,
				tsSubmitted: body.ts_submitted || nowIso,
				flowType,
				stateRequested: body.state_requested,
				tokenMatchStatus: 'not_applicable',
				pagePath: body.page_path,
				lastSeenAt: nowIso
			})
		)

		return json({
			ok: true,
			leadRecordId: created.recordId,
			tokenMatched: false,
			state: 'submitted'
		})
	} catch (error) {
		console.error('[lead-magnet/capture] Failed to capture lead', error)
		return json({ ok: false, error: 'Unable to capture lead' }, 500)
	}
}
