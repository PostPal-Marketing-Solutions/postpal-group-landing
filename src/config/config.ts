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
		src: '/logo.png',
		alt: 'PostPal logo'
	},
	canonical: true,
	noindex: false,
	mode: 'auto',
	scrollAnimations: true
}
