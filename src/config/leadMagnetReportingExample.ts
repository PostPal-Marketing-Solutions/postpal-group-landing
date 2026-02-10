export type LeadMagnetState = 'gated' | 'submitted' | 'known'
export type LeadSource = 'outreach' | 'ad' | 'social' | 'organic'

export type LeadCapturePayload = {
	email: string
	name?: string
	consent_marketing?: boolean
	lead_source: LeadSource
	asset_id: 'reporting-example-pdf-v1'
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	utm_content?: string
	ts_submitted: string
}

export type KnownLeadAccess = {
	state: 'known'
	token: string
	name?: string
}

export type ResolveKnownLeadResponse = {
	ok: boolean
	known: boolean
	tokenMatched: boolean
	name: string
	leadRecordId: string | null
}

export type CaptureLeadResponse = {
	ok: boolean
	leadRecordId: string | null
	tokenMatched: boolean
	state: 'submitted'
}

export const LEAD_MAGNET_EVENTS = {
	leadMagnetView: 'lead_magnet_view',
	leadMagnetFormSubmit: 'lead_magnet_form_submit',
	leadMagnetDownloadClick: 'lead_magnet_download_click',
	leadMagnetKnownUnlockView: 'lead_magnet_known_unlock_view',
	leadMagnetSecondaryCtaClick: 'lead_magnet_secondary_cta_click'
} as const

export const REPORTING_EXAMPLE_ASSET = {
	id: 'reporting-example-pdf-v1',
	title: 'CRM Print-Mailing Playbook 2026 für D2C Retention',
	pageCount: 24,
	readMinutes: 18,
	fileType: 'PDF',
	downloadUrl: '/downloads/9 Print Kampagnen die jede Brand nutzen sollte_v0.5.pdf',
	previewImage: '/postpal-app.png'
} as const

export const REPORTING_CONTENT_MODULES = [
	'Warum Print-Mailings im CRM-Mix wieder relevant sind und wann sie profitabel funktionieren',
	'8 Prinzipien für Segmentierung, Timing und Offer-Logik ohne Rabatt-Gießkanne',
	'RFM-Framework für klare Recency-, Frequency- und Monetary-Entscheidungen',
	'9 umsetzbare Kampagnentypen von Winback bis Reaktivierung mit Startpunkten',
	'Praxisbeispiele mit Kennzahlen aus D2C-Cases inkl. Learnings und Fehlerquellen',
	'Umsetzungsfahrplan: So bringst du die Logik in dein Team und in deinen CRM-Stack'
] as const

export const REPORTING_FAQ = [
	{
		question: 'Für wen ist das Playbook?',
		answer:
			'Für Shopify D2C Teams, CRM-Verantwortliche und Gründer, die Print-Mailing-Kampagnen strukturiert im Retention-Setup einsetzen wollen.'
	},
	{
		question: 'Was unterscheidet es von allgemeinem Print-Marketing?',
		answer:
			'Das Playbook zeigt keine allgemeinen Tipps, sondern konkrete Kampagnentypen, Segmentierungslogik und Praxisbeispiele mit Ergebnissen aus D2C-Setups.'
	},
	{
		question: 'Welche Daten brauche ich für den Download?',
		answer:
			'Für den Erstzugriff reicht deine E-Mail-Adresse. Weitere Angaben sind optional und können im Follow-up geklärt werden.'
	},
	{
		question: 'Was passiert mit meinen Daten?',
		answer:
			'Wir erfassen im v1-Flow nur die E-Mail-Adresse. Falls du optional zustimmst, senden wir dir zusätzliche praxisnahe Tipps. Details stehen in der Datenschutzerklärung.'
	}
] as const

export const CREDIBILITY_ITEMS = [
	'Praxisbeispiele aus echten D2C-Brands',
	'24 Seiten kompakter Umsetzungsleitfaden',
	'9 Kampagnentypen statt Rabatt-Gießkanne',
	'RFM-Logik für planbare CRM-Entscheidungen'
] as const

// Deprecated: production known-lead validation now happens server-side via Airtable lookups.
export const DEPRECATED_KNOWN_LEAD_TOKENS: Record<string, { firstName?: string }> = {
	'demo-felix': { firstName: 'Felix' },
	'demo-sarah': { firstName: 'Sarah' },
	'demo-growth-team': {}
}
