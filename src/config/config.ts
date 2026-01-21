// Config
// ------------
// Description: The configuration file for the website.

export interface Logo {
	src: string
	alt: string
}

export type Mode = 'auto' | 'light' | 'dark'

export interface Config {
	siteTitle: string
	siteDescription: string
	ogImage: string
	logo: Logo
	canonical: boolean
	noindex: boolean
	mode: Mode
	scrollAnimations: boolean
}

export const configData: Config = {
	siteTitle: 'PostPal - Postkartenmarketing neu erfunden',
	siteDescription:
		'PostPal is the leading platform for automated and personalized postcard campaigns, specifically designed for Shopify and DTC brands.',
	ogImage: '/og.jpg',
	logo: {
		src: 'https://cdn.prod.website-files.com/638cb72eb9a23c52a0d461f1/63ca6423a8dd6bb68cbc175e_logo-transparent-dark.png',
		alt: 'PostPal logo'
	},
	canonical: true,
	noindex: false,
	mode: 'auto',
	scrollAnimations: true
}
