import type { APIRoute } from 'astro'
import {
	buildLeadFields,
	createLead,
	deriveLeadSource,
	findByToken,
	incrementDownload,
	normalizeFirstName,
	normalizeLeadSource,
	normalizeRecordId,
	normalizeToken
} from '../../../lib/server/airtable'

export const prerender = false

type DownloadBody = {
	leadRecordId?: unknown
	token?: unknown
	name?: unknown
	asset_id?: unknown
	lead_source?: unknown
	utm_source?: unknown
	utm_medium?: unknown
	utm_campaign?: unknown
	utm_content?: unknown
	flow_type?: unknown
	state_requested?: unknown
	page_path?: unknown
	token_matched?: unknown
}

const json = (payload: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	})

const parseBody = async (request: Request): Promise<DownloadBody> => {
	try {
		const parsed = await request.json()
		return typeof parsed === 'object' && parsed !== null ? (parsed as DownloadBody) : {}
	} catch {
		return {}
	}
}

export const POST: APIRoute = async ({ request }) => {
	const body = await parseBody(request)
	const leadRecordId = normalizeRecordId(body.leadRecordId)
	const token = normalizeToken(body.token)
	const firstName = normalizeFirstName(body.name)
	const leadSource =
		normalizeLeadSource(body.lead_source) ||
		deriveLeadSource({
			token,
			utmSource: body.utm_source,
			utmMedium: body.utm_medium
		})
	const nowIso = new Date().toISOString()

	const sharedFields = buildLeadFields({
		token,
		firstName,
		assetId: body.asset_id,
		leadSource,
		utmSource: body.utm_source,
		utmMedium: body.utm_medium,
		utmCampaign: body.utm_campaign,
		utmContent: body.utm_content,
		flowType: body.flow_type || (token ? 'known' : 'gated'),
		stateRequested: body.state_requested,
		pagePath: body.page_path,
		lastSeenAt: nowIso
	})

	try {
		if (leadRecordId) {
			const tokenMatchStatus =
				body.token_matched === true
					? 'matched'
					: body.token_matched === false
						? 'unmatched'
						: sharedFields['token_match_status']

			const updated = await incrementDownload(leadRecordId, {
				...sharedFields,
				token_match_status: tokenMatchStatus
			})

			return json({
				ok: true,
				status: 'updated_by_record_id',
				leadRecordId: updated.recordId,
				tokenMatched: updated.tokenMatched
			})
		}
	} catch (error) {
		console.error('[lead-magnet/download] Failed to update by leadRecordId', error)
	}

	try {
		if (token) {
			const match = await findByToken(token)

			if (match.recordId && match.tokenMatched) {
				const updated = await incrementDownload(match.recordId, {
					...sharedFields,
					token_match_status: 'matched'
				})

				return json({
					ok: true,
					status: 'updated_by_token',
					leadRecordId: updated.recordId,
					tokenMatched: true
				})
			}

			const created = await createLead({
				...sharedFields,
				token,
				ts_downloaded: nowIso,
				download_count: 1,
				token_match_status: 'unmatched'
			})

			return json({
				ok: true,
				status: 'created_from_unmatched_token',
				leadRecordId: created.recordId,
				tokenMatched: false
			})
		}

		return json({
			ok: true,
			status: 'noop_no_identifier',
			leadRecordId: null,
			tokenMatched: false
		})
	} catch (error) {
		console.error('[lead-magnet/download] Failed to track download', error)
		return json({ ok: false, error: 'Unable to track download' }, 500)
	}
}
