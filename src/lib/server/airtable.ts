const AIRTABLE_API_BASE = 'https://api.airtable.com/v0'

const AIRTABLE_FIELD_MAP = {
	email: 'email',
	token: 'token',
	firstName: 'name',
	consentMarketing: 'consent_marketing',
	leadSource: 'lead_source',
	assetId: 'asset_id',
	utmSource: 'utm_source',
	utmMedium: 'utm_medium',
	utmCampaign: 'utm_campaign',
	utmContent: 'utm_content',
	tsSubmitted: 'ts_submitted',
	tsDownloaded: 'ts_downloaded',
	downloadCount: 'download_count',
	flowType: 'flow_type',
	stateRequested: 'state_requested',
	tokenMatchStatus: 'token_match_status',
	pagePath: 'page_path',
	lastSeenAt: 'last_seen_at'
} as const

type AirtableRecord = {
	id: string
	createdTime?: string
	fields: Record<string, unknown>
}

type AirtableListResponse = {
	records: AirtableRecord[]
}

type AirtableSingleResponse = AirtableRecord

type AirtableCreateResponse = {
	records: AirtableRecord[]
}

type AirtableUpdateResponse = {
	records: AirtableRecord[]
}

type AirtableConfig = {
	apiToken: string
	baseId: string
	tableName: string
}

let hasWarnedTokenPrefix = false

export type LeadSource = 'outreach' | 'ad' | 'social' | 'organic'

export type TokenLookupResult = {
	recordId: string | null
	tokenMatched: boolean
	firstName: string
	downloadCount: number
	createdTime: string | null
}

const getAirtableConfig = (): AirtableConfig => {
	const getEnv = (key: 'AIRTABLE_API_TOKEN' | 'AIRTABLE_BASE_ID' | 'AIRTABLE_LEADS_TABLE') => {
		const fromAstro = import.meta.env[key]
		if (typeof fromAstro === 'string' && fromAstro.trim()) {
			return fromAstro.trim()
		}

		const fromProcess = process.env[key]
		if (typeof fromProcess === 'string' && fromProcess.trim()) {
			return fromProcess.trim()
		}

		return undefined
	}

	const apiToken = getEnv('AIRTABLE_API_TOKEN')
	const baseId = getEnv('AIRTABLE_BASE_ID')
	const tableName = getEnv('AIRTABLE_LEADS_TABLE')

	if (!apiToken || !baseId || !tableName) {
		const missing = [
			!apiToken ? 'AIRTABLE_API_TOKEN' : null,
			!baseId ? 'AIRTABLE_BASE_ID' : null,
			!tableName ? 'AIRTABLE_LEADS_TABLE' : null
		]
			.filter(Boolean)
			.join(', ')
		throw new Error(
			`Airtable config is incomplete. Required: AIRTABLE_API_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_LEADS_TABLE. Missing: ${missing}`
		)
	}

	if (baseId.includes('/')) {
		throw new Error('Airtable config is incomplete. AIRTABLE_BASE_ID must contain only the base id (app...), no path segments.')
	}

	if (!/^app[0-9A-Za-z]+$/.test(baseId)) {
		throw new Error('Airtable config is incomplete. AIRTABLE_BASE_ID must match ^app[0-9A-Za-z]+$.')
	}

	if (tableName.includes('/')) {
		throw new Error('Airtable config is incomplete. AIRTABLE_LEADS_TABLE must be a table name, not a path or id pair.')
	}

	if (!apiToken.startsWith('pat') && !hasWarnedTokenPrefix) {
		hasWarnedTokenPrefix = true
		console.warn('[lead-magnet/airtable] AIRTABLE_API_TOKEN does not start with "pat". Verify token format and permissions.')
	}

	return {
		apiToken,
		baseId,
		tableName
	}
}

const pickDefinedFields = (fields: Record<string, unknown>) => {
	return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null))
}

const airtableFetch = async <T>(
	path: string,
	init: RequestInit & { method: 'GET' | 'POST' | 'PATCH' }
): Promise<T> => {
	const config = getAirtableConfig()
	const response = await fetch(`${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(config.tableName)}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${config.apiToken}`,
			'Content-Type': 'application/json',
			...init.headers
		}
	})

	if (!response.ok) {
		const body = await response.text()
		throw new Error(`Airtable request failed (${response.status}): ${body.slice(0, 400)}`)
	}

	return (await response.json()) as T
}

const normalizeText = (value: unknown, maxLength = 255): string | undefined => {
	if (typeof value !== 'string') {
		return undefined
	}

	const trimmed = value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim()
	if (!trimmed) {
		return undefined
	}

	return trimmed.slice(0, maxLength)
}

export const normalizeEmail = (value: unknown): string | undefined => {
	const normalized = normalizeText(value, 320)?.toLowerCase()
	if (!normalized) {
		return undefined
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
		return undefined
	}

	return normalized
}

export const normalizeToken = (value: unknown): string | undefined => {
	const token = normalizeText(value, 120)
	if (!token) {
		return undefined
	}

	if (!/^[A-Za-z0-9_-]+$/.test(token)) {
		return undefined
	}

	return token
}

export const normalizeFirstName = (value: unknown): string | undefined => {
	return normalizeText(value, 120)
}

export const normalizeLeadSource = (value: unknown): LeadSource | undefined => {
	if (typeof value !== 'string') {
		return undefined
	}

	const normalized = value.trim().toLowerCase()
	if (normalized === 'outreach' || normalized === 'ad' || normalized === 'social' || normalized === 'organic') {
		return normalized
	}

	return undefined
}

export const deriveLeadSource = (input: {
	token?: unknown
	utmSource?: unknown
	utmMedium?: unknown
}): LeadSource => {
	const token = normalizeToken(input.token)
	if (token) {
		return 'outreach'
	}

	const medium = normalizeText(input.utmMedium, 120)?.toLowerCase() || ''
	const source = normalizeText(input.utmSource, 120)?.toLowerCase() || ''
	const adMediums = new Set(['cpc', 'ppc', 'paid', 'paid_social', 'display'])
	const socialMediums = new Set(['social', 'organic_social'])
	const socialSources = new Set(['linkedin', 'facebook', 'instagram', 'x', 'twitter', 'tiktok'])

	if (adMediums.has(medium)) {
		return 'ad'
	}

	if (socialMediums.has(medium) || socialSources.has(source)) {
		return 'social'
	}

	return 'organic'
}

export const deriveNameFromEmail = (email: string): string => {
	const localPart = (email.split('@')[0] || '').trim()
	const normalized = localPart.replace(/[^A-Za-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
	return normalized || 'Lead'
}

export const normalizeRecordId = (value: unknown): string | undefined => {
	if (typeof value !== 'string') {
		return undefined
	}

	const trimmed = value.trim()
	if (!/^rec[a-zA-Z0-9]{8,}$/.test(trimmed)) {
		return undefined
	}

	return trimmed
}

const normalizeBoolean = (value: unknown): boolean | undefined => {
	if (typeof value === 'boolean') {
		return value
	}

	if (typeof value === 'string') {
		if (value === 'true') return true
		if (value === 'false') return false
	}

	return undefined
}

const normalizeIsoTimestamp = (value: unknown): string | undefined => {
	if (typeof value !== 'string') {
		return undefined
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return undefined
	}

	return date.toISOString()
}

const normalizeDownloadCount = (value: unknown): number => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.max(0, Math.floor(value))
	}

	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10)
		if (Number.isFinite(parsed)) {
			return Math.max(0, parsed)
		}
	}

	return 0
}

const escapeFormulaString = (value: string): string => {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/[\r\n]/g, ' ')
}

const toLookupResult = (record: AirtableRecord | null): TokenLookupResult => {
	if (!record) {
		return {
			recordId: null,
			tokenMatched: false,
			firstName: '',
			downloadCount: 0,
			createdTime: null
		}
	}

	return {
		recordId: record.id,
		tokenMatched: true,
		firstName: normalizeText(record.fields[AIRTABLE_FIELD_MAP.firstName], 120) || '',
		downloadCount: normalizeDownloadCount(record.fields[AIRTABLE_FIELD_MAP.downloadCount]),
		createdTime: typeof record.createdTime === 'string' ? record.createdTime : null
	}
}

export const findByToken = async (token: string): Promise<TokenLookupResult> => {
	const normalizedToken = normalizeToken(token)
	if (!normalizedToken) {
		return toLookupResult(null)
	}

	const filterByFormula = `{${AIRTABLE_FIELD_MAP.token}}='${escapeFormulaString(normalizedToken)}'`
	const params = new URLSearchParams({
		maxRecords: '1',
		filterByFormula
	})

	const payload = await airtableFetch<AirtableListResponse>(`?${params.toString()}`, {
		method: 'GET'
	})

	const firstRecord = payload.records[0] || null
	return toLookupResult(firstRecord)
}

export const findByRecordId = async (recordId: string): Promise<AirtableRecord | null> => {
	const normalizedRecordId = normalizeRecordId(recordId)
	if (!normalizedRecordId) {
		return null
	}

	try {
		return await airtableFetch<AirtableSingleResponse>(`/${normalizedRecordId}`, {
			method: 'GET'
		})
	} catch {
		return null
	}
}

export const createLead = async (fields: Record<string, unknown>): Promise<TokenLookupResult> => {
	const payload = await airtableFetch<AirtableCreateResponse>('', {
		method: 'POST',
		body: JSON.stringify({
			records: [
				{
					fields: pickDefinedFields(fields)
				}
			]
		})
	})

	const created = payload.records[0] || null
	return toLookupResult(created)
}

export const updateLead = async (recordId: string, fields: Record<string, unknown>): Promise<TokenLookupResult> => {
	const normalizedRecordId = normalizeRecordId(recordId)
	if (!normalizedRecordId) {
		throw new Error('Invalid Airtable record id for update')
	}

	const payload = await airtableFetch<AirtableUpdateResponse>('', {
		method: 'PATCH',
		body: JSON.stringify({
			records: [
				{
					id: normalizedRecordId,
					fields: pickDefinedFields(fields)
				}
			]
		})
	})

	return toLookupResult(payload.records[0] || null)
}

export const incrementDownload = async (
	recordId: string,
	extraFields: Record<string, unknown> = {}
): Promise<TokenLookupResult> => {
	const record = await findByRecordId(recordId)
	if (!record) {
		throw new Error('Record not found for download increment')
	}

	const currentCount = normalizeDownloadCount(record.fields[AIRTABLE_FIELD_MAP.downloadCount])
	const now = new Date().toISOString()

	return updateLead(record.id, {
		[AIRTABLE_FIELD_MAP.downloadCount]: currentCount + 1,
		[AIRTABLE_FIELD_MAP.tsDownloaded]: now,
		[AIRTABLE_FIELD_MAP.lastSeenAt]: now,
		...extraFields
	})
}

export const buildLeadFields = (input: {
	email?: unknown
	token?: unknown
	firstName?: unknown
	consentMarketing?: unknown
	leadSource?: unknown
	assetId?: unknown
	utmSource?: unknown
	utmMedium?: unknown
	utmCampaign?: unknown
	utmContent?: unknown
	tsSubmitted?: unknown
	tsDownloaded?: unknown
	flowType?: unknown
	stateRequested?: unknown
	tokenMatchStatus?: unknown
	pagePath?: unknown
	lastSeenAt?: unknown
	downloadCount?: unknown
}) => {
	const nowIso = new Date().toISOString()

	return pickDefinedFields({
		[AIRTABLE_FIELD_MAP.email]: normalizeEmail(input.email),
		[AIRTABLE_FIELD_MAP.token]: normalizeToken(input.token),
		[AIRTABLE_FIELD_MAP.firstName]: normalizeFirstName(input.firstName),
		[AIRTABLE_FIELD_MAP.consentMarketing]: normalizeBoolean(input.consentMarketing),
		[AIRTABLE_FIELD_MAP.leadSource]: normalizeText(input.leadSource, 80),
		[AIRTABLE_FIELD_MAP.assetId]: normalizeText(input.assetId, 120),
		[AIRTABLE_FIELD_MAP.utmSource]: normalizeText(input.utmSource, 120),
		[AIRTABLE_FIELD_MAP.utmMedium]: normalizeText(input.utmMedium, 120),
		[AIRTABLE_FIELD_MAP.utmCampaign]: normalizeText(input.utmCampaign, 180),
		[AIRTABLE_FIELD_MAP.utmContent]: normalizeText(input.utmContent, 180),
		[AIRTABLE_FIELD_MAP.tsSubmitted]: normalizeIsoTimestamp(input.tsSubmitted),
		[AIRTABLE_FIELD_MAP.tsDownloaded]: normalizeIsoTimestamp(input.tsDownloaded),
		[AIRTABLE_FIELD_MAP.flowType]: normalizeText(input.flowType, 40),
		[AIRTABLE_FIELD_MAP.stateRequested]: normalizeText(input.stateRequested, 40),
		[AIRTABLE_FIELD_MAP.tokenMatchStatus]: normalizeText(input.tokenMatchStatus, 40),
		[AIRTABLE_FIELD_MAP.pagePath]: normalizeText(input.pagePath, 255),
		[AIRTABLE_FIELD_MAP.lastSeenAt]: normalizeIsoTimestamp(input.lastSeenAt) || nowIso,
		[AIRTABLE_FIELD_MAP.downloadCount]:
			typeof input.downloadCount === 'number' ? Math.max(0, Math.floor(input.downloadCount)) : undefined
	})
}

export const AIRTABLE_FIELDS = AIRTABLE_FIELD_MAP
