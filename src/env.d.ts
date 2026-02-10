/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly AIRTABLE_API_TOKEN?: string
	readonly AIRTABLE_BASE_ID?: string
	readonly AIRTABLE_LEADS_TABLE?: string
}

declare namespace NodeJS {
	interface ProcessEnv {
		AIRTABLE_API_TOKEN?: string
		AIRTABLE_BASE_ID?: string
		AIRTABLE_LEADS_TABLE?: string
	}
}
