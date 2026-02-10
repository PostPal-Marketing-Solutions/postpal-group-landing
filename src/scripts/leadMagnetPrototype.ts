type LeadMagnetState = 'gated' | 'submitted' | 'known'

type LeadMagnetEventMap = {
	leadMagnetView: string
	leadMagnetFormSubmit: string
	leadMagnetDownloadClick: string
	leadMagnetKnownUnlockView: string
	leadMagnetSecondaryCtaClick: string
}

type LeadAsset = {
	id: string
}

type LeadSource = 'outreach' | 'ad' | 'social' | 'organic'

type LeadPayload = {
	email: string
	consent_marketing: boolean
	lead_source: LeadSource
	asset_id: string
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	utm_content?: string
	ts_submitted: string
	token?: string
	name?: string
	tokenMatched?: boolean
	leadRecordId?: string
	tsCaptured?: string
}

type KnownLeadResponse = {
	ok?: boolean
	known?: boolean
	tokenMatched?: boolean
	name?: string
	leadRecordId?: string | null
}

type CaptureLeadResponse = {
	ok?: boolean
	leadRecordId?: string | null
	tokenMatched?: boolean
	state?: 'submitted'
}

type DownloadTrackPayload = {
	leadRecordId?: string
	token?: string
	name?: string
	asset_id: string
	lead_source: LeadSource
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	utm_content?: string
	flow_type: 'known' | 'gated'
	state_requested?: string
	page_path: string
	token_matched?: boolean
}

declare global {
	interface Window {
		dataLayer?: Array<Record<string, unknown>>
	}
}

const safeParse = <T>(raw: string | undefined | null, fallback: T): T => {
	if (!raw) {
		return fallback
	}

	try {
		return JSON.parse(raw) as T
	} catch {
		return fallback
	}
}

const collectUtmValues = (searchParams: URLSearchParams) => ({
	utm_source: searchParams.get('utm_source') || undefined,
	utm_medium: searchParams.get('utm_medium') || undefined,
	utm_campaign: searchParams.get('utm_campaign') || undefined,
	utm_content: searchParams.get('utm_content') || undefined
})

const normalizeLeadToken = (value: string | undefined | null): string => {
	const token = (value || '').trim()
	if (!token) {
		return ''
	}

	return /^[A-Za-z0-9_-]+$/.test(token) ? token : ''
}

const deriveLeadSource = (input: { token?: string; utm_source?: string; utm_medium?: string }): LeadSource => {
	if (input.token) {
		return 'outreach'
	}

	const medium = (input.utm_medium || '').trim().toLowerCase()
	const source = (input.utm_source || '').trim().toLowerCase()
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

const deriveFlow2NameFromEmail = (email: string): string => {
	const emailLocal = (email.split('@')[0] || '').trim()
	const normalized = emailLocal.replace(/[^A-Za-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
	return normalized || 'Lead'
}

const readStoredPayload = (): Partial<LeadPayload> | null => {
	try {
		const rawPayload = sessionStorage.getItem('leadMagnetPayload')
		return rawPayload ? safeParse<Partial<LeadPayload> | null>(rawPayload, null) : null
	} catch {
		return null
	}
}

const storeLeadPayload = (payload: Partial<LeadPayload>) => {
	try {
		sessionStorage.setItem('leadMagnetPayload', JSON.stringify(payload))
	} catch {
		// Ignore storage errors.
	}
}

const setStateBlocks = (root: HTMLElement, currentState: LeadMagnetState) => {
	root.querySelectorAll<HTMLElement>('[data-state-block]').forEach((element) => {
		const targetState = element.getAttribute('data-state-block')
		element.hidden = targetState !== currentState
	})
}

const setInlineFormError = (form: HTMLFormElement, message: string) => {
	let errorNode = form.parentElement?.querySelector<HTMLElement>('[data-form-error]')
	if (!errorNode) {
		errorNode = document.createElement('p')
		errorNode.setAttribute('data-form-error', 'true')
		errorNode.setAttribute('role', 'alert')
		errorNode.setAttribute('aria-live', 'polite')
		errorNode.style.marginTop = '0.5rem'
		errorNode.style.fontSize = '0.9rem'
		errorNode.style.color = '#b42318'
		form.parentElement?.appendChild(errorNode)
	}

	errorNode.textContent = message
	errorNode.hidden = !message
}

const setFormSubmitting = (form: HTMLFormElement, isSubmitting: boolean) => {
	const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')
	if (!submitButton) {
		return
	}

	submitButton.disabled = isSubmitting
	submitButton.setAttribute('aria-busy', isSubmitting ? 'true' : 'false')
}

const toTokenMatchStatus = (token: string, tokenMatched?: boolean | null) => {
	if (!token) {
		return 'not_applicable'
	}

	if (tokenMatched === true) {
		return 'matched'
	}

	if (tokenMatched === false) {
		return 'unmatched'
	}

	return 'unknown'
}

const resolveKnownLead = async (token: string, firstName: string): Promise<KnownLeadResponse | null> => {
	if (!token) {
		return null
	}

	const lookupUrl = new URL('/api/lead-magnet/resolve-known', window.location.origin)
	lookupUrl.searchParams.set('token', token)
	if (firstName) {
		lookupUrl.searchParams.set('firstname', firstName)
	}

	try {
		const response = await fetch(lookupUrl.toString(), {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			credentials: 'same-origin'
		})

		const body = (await response.json()) as KnownLeadResponse
		return body
	} catch {
		return null
	}
}

const postCaptureLead = async (payload: Record<string, unknown>): Promise<CaptureLeadResponse> => {
	const response = await fetch('/api/lead-magnet/capture', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		credentials: 'same-origin',
		body: JSON.stringify(payload)
	})

	const body = (await response.json()) as CaptureLeadResponse
	if (!response.ok || !body.ok) {
		throw new Error('Capture request failed')
	}

	return body
}

const trackDownload = (payload: DownloadTrackPayload) => {
	const endpoint = '/api/lead-magnet/download'
	const body = JSON.stringify(payload)

	if ('sendBeacon' in navigator) {
		const blob = new Blob([body], { type: 'application/json' })
		if (navigator.sendBeacon(endpoint, blob)) {
			return
		}
	}

	void fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'same-origin',
		keepalive: true,
		body
	}).catch(() => {
		// Do not block navigation if tracking fails.
	})
}

export const initLeadMagnetPrototype = (rootSelector: string) => {
	const root = document.querySelector<HTMLElement>(rootSelector)
	if (!root) {
		return
	}

	void (async () => {
		const events = safeParse<LeadMagnetEventMap>(root.dataset.events, {
			leadMagnetView: 'lead_magnet_view',
			leadMagnetFormSubmit: 'lead_magnet_form_submit',
			leadMagnetDownloadClick: 'lead_magnet_download_click',
			leadMagnetKnownUnlockView: 'lead_magnet_known_unlock_view',
			leadMagnetSecondaryCtaClick: 'lead_magnet_secondary_cta_click'
		})
		const asset = safeParse<LeadAsset>(root.dataset.asset, { id: 'reporting-example-pdf-v1' })

		const params = new URLSearchParams(window.location.search)
		const requestedState = params.get('state') || undefined
		const token = normalizeLeadToken(params.get('token'))
		const firstNameParam = (params.get('firstname') || '').trim()
		const requireEmailGate = root.dataset.requireEmailGate === 'true'
		const utmValues = collectUtmValues(params)
		const leadSource = deriveLeadSource({
			token: token || undefined,
			utm_source: utmValues.utm_source,
			utm_medium: utmValues.utm_medium
		})

		const storedPayload = readStoredPayload()
		const hasStoredEmail = Boolean(storedPayload?.email?.trim())

		const shouldUseKnownState = requestedState === 'known' && Boolean(token) && !requireEmailGate

		let currentState: LeadMagnetState = 'gated'
		if (requestedState === 'submitted' && (!requireEmailGate || hasStoredEmail)) {
			currentState = 'submitted'
		}
		if (shouldUseKnownState) {
			currentState = 'known'
		}

		setStateBlocks(root, currentState)

		let resolvedFirstName = shouldUseKnownState ? firstNameParam || storedPayload?.name || '' : ''
		let resolvedLeadRecordId = storedPayload?.leadRecordId || ''
		let tokenMatched: boolean | null =
			typeof storedPayload?.tokenMatched === 'boolean' ? storedPayload.tokenMatched : null

		if (shouldUseKnownState) {
			const resolvedKnownLead = await resolveKnownLead(token, firstNameParam)
			if (resolvedKnownLead) {
				if (resolvedKnownLead.name) {
					resolvedFirstName = resolvedKnownLead.name
				}
				if (resolvedKnownLead.leadRecordId) {
					resolvedLeadRecordId = resolvedKnownLead.leadRecordId
				}
				if (typeof resolvedKnownLead.tokenMatched === 'boolean') {
					tokenMatched = resolvedKnownLead.tokenMatched
				}
			}
		}

		const invalidKnownLinkNotice = root.querySelector<HTMLElement>('[data-invalid-known-link]')
		if (invalidKnownLinkNotice) {
			const hasInvalidKnownState = requestedState === 'known' && !token
			invalidKnownLinkNotice.hidden = !hasInvalidKnownState
		}

		const knownGreeting = root.querySelector<HTMLElement>('[data-known-greeting]')
		if (knownGreeting && resolvedFirstName) {
			knownGreeting.textContent = `Hallo ${resolvedFirstName}`
		}

		const submittedEmail = root.querySelector<HTMLElement>('[data-last-email]')
		if (submittedEmail && storedPayload?.email) {
			submittedEmail.textContent = ` Letzte Anmeldung: ${storedPayload.email}`
		}

		if (currentState === 'known') {
			storeLeadPayload({
				...storedPayload,
				token: token || undefined,
				name: resolvedFirstName || undefined,
				leadRecordId: resolvedLeadRecordId || undefined,
				tokenMatched: typeof tokenMatched === 'boolean' ? tokenMatched : undefined
			})
		}

		const dataLayer = (window.dataLayer = window.dataLayer || [])
		const pushLeadEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
			dataLayer.push({
				event: eventName,
				...payload
			})
		}

		const tokenMatchStatus = toTokenMatchStatus(token, tokenMatched)

		pushLeadEvent(events.leadMagnetView, {
			state: currentState,
			asset_id: asset.id,
			token_match_status: tokenMatchStatus
		})

		if (currentState === 'known') {
			pushLeadEvent(events.leadMagnetKnownUnlockView, {
				token,
				token_match_status: tokenMatchStatus
			})
		}

		root.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach((form) => {
			form.addEventListener('submit', async (event) => {
				event.preventDefault()
				setInlineFormError(form, '')

				const emailInput = form.querySelector<HTMLInputElement>('[data-email-input]')
				const formContainer = form.closest<HTMLElement>('[data-state-block="gated"]') || form.parentElement
				const consentCheckbox =
					formContainer?.querySelector<HTMLInputElement>('[data-consent-input]') ||
					form.querySelector<HTMLInputElement>('[data-consent-input]')
				const consentMarketing = Boolean(consentCheckbox?.checked)

				if (!emailInput || !emailInput.checkValidity()) {
					emailInput?.reportValidity()
					return
				}

				const email = emailInput.value.trim()
				const tsSubmitted = new Date().toISOString()
				const flow2Name = token ? undefined : deriveFlow2NameFromEmail(email)

				setFormSubmitting(form, true)
				try {
					const captureResponse = await postCaptureLead({
						email,
						consent_marketing: consentMarketing,
						lead_source: leadSource,
						asset_id: asset.id,
						...utmValues,
						ts_submitted: tsSubmitted,
						token: token || undefined,
						name: token ? resolvedFirstName || undefined : flow2Name,
						flow_type: token ? 'known' : 'gated',
						state_requested: requestedState || 'gated',
						page_path: window.location.pathname
					})

					storeLeadPayload({
						email,
						consent_marketing: consentMarketing,
						lead_source: leadSource,
						asset_id: asset.id,
						...utmValues,
						ts_submitted: tsSubmitted,
						token: token || undefined,
						name: token ? resolvedFirstName || undefined : flow2Name,
						tokenMatched: captureResponse.tokenMatched,
						leadRecordId: captureResponse.leadRecordId || undefined,
						tsCaptured: new Date().toISOString()
					})

					pushLeadEvent(events.leadMagnetFormSubmit, {
						asset_id: asset.id,
						consent_marketing: consentMarketing,
						token_match_status: toTokenMatchStatus(token, captureResponse.tokenMatched)
					})

					const nextUrl = new URL(window.location.origin + window.location.pathname)
					nextUrl.searchParams.set('state', 'submitted')

					Object.entries(utmValues).forEach(([key, value]) => {
						if (value) {
							nextUrl.searchParams.set(key, value)
						}
					})

					if (token) {
						nextUrl.searchParams.set('token', token)
					}
					if (token && firstNameParam) {
						nextUrl.searchParams.set('firstname', firstNameParam)
					}

					window.location.assign(nextUrl.toString())
				} catch {
					setInlineFormError(form, 'Der Download konnte gerade nicht freigeschaltet werden. Bitte versuche es erneut.')
				} finally {
					setFormSubmitting(form, false)
				}
			})
		})

		root.querySelectorAll<HTMLElement>('[data-track-download]').forEach((element) => {
			element.addEventListener('click', () => {
				pushLeadEvent(events.leadMagnetDownloadClick, {
					state: currentState,
					asset_id: asset.id,
					token_match_status: tokenMatchStatus
				})

				const latestPayload = readStoredPayload()
				const latestToken = normalizeLeadToken(latestPayload?.token)
				const effectiveToken = token || latestToken || undefined
				const downloadLeadSource = deriveLeadSource({
					token: effectiveToken,
					utm_source: utmValues.utm_source || latestPayload?.utm_source,
					utm_medium: utmValues.utm_medium || latestPayload?.utm_medium
				})
				const downloadPayload: DownloadTrackPayload = {
					leadRecordId: latestPayload?.leadRecordId || resolvedLeadRecordId || undefined,
					token: effectiveToken,
					name: effectiveToken ? resolvedFirstName || latestPayload?.name : latestPayload?.name,
					asset_id: asset.id,
					lead_source: downloadLeadSource,
					...utmValues,
					flow_type: effectiveToken ? 'known' : 'gated',
					state_requested: requestedState,
					page_path: window.location.pathname,
					token_matched:
						typeof latestPayload?.tokenMatched === 'boolean' ? latestPayload.tokenMatched : tokenMatched === true
				}

				trackDownload(downloadPayload)
			})
		})

		root.querySelectorAll<HTMLElement>('[data-track-secondary]').forEach((element) => {
			element.addEventListener('click', () => {
				pushLeadEvent(events.leadMagnetSecondaryCtaClick, {
					state: currentState
				})
			})
		})
	})()
}
