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

type KnownLeadTokens = Record<string, { firstName?: string }>

type LeadPayload = {
	email: string
	consent_marketing: boolean
	lead_source: 'outreach'
	asset_id: string
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	utm_content?: string
	ts_submitted: string
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

export const initLeadMagnetPrototype = (rootSelector: string) => {
	const root = document.querySelector<HTMLElement>(rootSelector)
	if (!root) {
		return
	}

	const events = safeParse<LeadMagnetEventMap>(root.dataset.events, {
		leadMagnetView: 'lead_magnet_view',
		leadMagnetFormSubmit: 'lead_magnet_form_submit',
		leadMagnetDownloadClick: 'lead_magnet_download_click',
		leadMagnetKnownUnlockView: 'lead_magnet_known_unlock_view',
		leadMagnetSecondaryCtaClick: 'lead_magnet_secondary_cta_click'
	})
	const asset = safeParse<LeadAsset>(root.dataset.asset, { id: 'reporting-example-pdf-v1' })
	const knownLeadTokens = safeParse<KnownLeadTokens>(root.dataset.knownLeadTokens, {})

	const params = new URLSearchParams(window.location.search)
	const requestedState = params.get('state')
	const token = (params.get('token') || '').trim()
	const requireEmailGate = root.dataset.requireEmailGate === 'true'
	const knownLeadEntry = token ? knownLeadTokens[token] : undefined
	const hasValidKnownLink = requestedState === 'known' && Boolean(token) && Boolean(knownLeadEntry)

	let storedPayload: Partial<LeadPayload> | null = null
	try {
		const rawPayload = sessionStorage.getItem('leadMagnetPayload')
		storedPayload = rawPayload ? safeParse<Partial<LeadPayload> | null>(rawPayload, null) : null
	} catch {
		storedPayload = null
	}

	const hasStoredEmail = Boolean(storedPayload?.email?.trim())

	let currentState: LeadMagnetState = 'gated'
	if (requestedState === 'submitted' && (!requireEmailGate || hasStoredEmail)) {
		currentState = 'submitted'
	}
	if (hasValidKnownLink && !requireEmailGate) {
		currentState = 'known'
	}

	const dataLayer = (window.dataLayer = window.dataLayer || [])
	const pushLeadEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
		dataLayer.push({
			event: eventName,
			...payload
		})
	}

	root.querySelectorAll<HTMLElement>('[data-state-block]').forEach((element) => {
		const targetState = element.getAttribute('data-state-block')
		element.hidden = targetState !== currentState
	})

	const invalidKnownLinkNotice = root.querySelector<HTMLElement>('[data-invalid-known-link]')
	if (invalidKnownLinkNotice) {
		const hasInvalidKnownState = requestedState === 'known' && !hasValidKnownLink
		invalidKnownLinkNotice.classList.toggle('hidden', !hasInvalidKnownState)
	}

	const knownGreeting = root.querySelector<HTMLElement>('[data-known-greeting]')
	if (knownGreeting && knownLeadEntry && knownLeadEntry.firstName) {
		knownGreeting.textContent = `Willkommen zurück, ${knownLeadEntry.firstName}`
	}

	const submittedEmail = root.querySelector<HTMLElement>('[data-last-email]')
	if (submittedEmail && storedPayload && storedPayload.email) {
		submittedEmail.textContent = ` Letzte Anmeldung: ${storedPayload.email}`
	}

	pushLeadEvent(events.leadMagnetView, {
		state: currentState,
		asset_id: asset.id
	})

	if (currentState === 'known') {
		pushLeadEvent(events.leadMagnetKnownUnlockView, {
			token
		})
	}

	root.querySelectorAll<HTMLFormElement>('[data-lead-form]').forEach((form) => {
		form.addEventListener('submit', (event) => {
			event.preventDefault()

			const emailInput = form.querySelector<HTMLInputElement>('[data-email-input]')
			const consentCheckbox = form.querySelector<HTMLInputElement>('[data-consent-input]')

			if (!emailInput || !emailInput.checkValidity()) {
				emailInput?.reportValidity()
				return
			}

			const utmValues = collectUtmValues(new URLSearchParams(window.location.search))
			const payload: LeadPayload = {
				email: emailInput.value.trim(),
				consent_marketing: Boolean(consentCheckbox?.checked),
				lead_source: 'outreach',
				asset_id: asset.id,
				...utmValues,
				ts_submitted: new Date().toISOString()
			}

			try {
				sessionStorage.setItem('leadMagnetPayload', JSON.stringify(payload))
			} catch {
				// Ignore storage errors.
			}

			pushLeadEvent(events.leadMagnetFormSubmit, {
				asset_id: payload.asset_id,
				consent_marketing: payload.consent_marketing
			})

			const nextUrl = new URL(window.location.origin + window.location.pathname)
			nextUrl.searchParams.set('state', 'submitted')

			Object.entries(utmValues).forEach(([key, value]) => {
				if (value) {
					nextUrl.searchParams.set(key, value)
				}
			})

			window.location.assign(nextUrl.toString())
		})
	})

	root.querySelectorAll<HTMLElement>('[data-track-download]').forEach((element) => {
		element.addEventListener('click', () => {
			pushLeadEvent(events.leadMagnetDownloadClick, {
				state: currentState,
				asset_id: asset.id
			})
		})
	})

	root.querySelectorAll<HTMLElement>('[data-track-secondary]').forEach((element) => {
		element.addEventListener('click', () => {
			pushLeadEvent(events.leadMagnetSecondaryCtaClick, {
				state: currentState
			})
		})
	})
}
