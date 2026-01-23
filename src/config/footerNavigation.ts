// Footer Navigation
// ------------
// Description: The footer navigation data for the website.
export interface Logo {
	src: string
	alt: string
	text: string
}

export interface FooterAbout {
	title: string
	aboutText: string
	logo: Logo
}

export interface SubCategory {
	subCategory: string
	subCategoryLink: string
}

export interface FooterColumn {
	category: string
	subCategories: SubCategory[]
}

export interface SubFooter {
	copywriteText: string
}

export interface FooterData {
	footerAbout: FooterAbout
	footerColumns: FooterColumn[]
	subFooter: SubFooter
}

export const footerNavigationData: FooterData = {
	footerAbout: {
		title: 'PostPal Group',
		aboutText:
			'Die PostPal Group ist das Zuhause von PostPal – der führenden Plattform für automatisiertes Postkartenmarketing auf Shopify und Klaviyo.',
		logo: {
			src: 'https://cdn.prod.website-files.com/638cb72eb9a23c52a0d461f1/63ca6423a8dd6bb68cbc175e_logo-transparent-dark.png',
			alt: 'PostPal Logo',
			text: 'PostPal'
		}
	},
	footerColumns: [
		{
			category: 'Plattform',
			subCategories: [
				{
					subCategory: 'PostPal App',
					subCategoryLink: 'https://www.getpostpal.com/'
				},
				{
					subCategory: 'Shopify App Store',
					subCategoryLink: 'https://apps.shopify.com/postpal'
				},
				{
					subCategory: 'Klaviyo Marketplace',
					subCategoryLink: 'https://marketplace.klaviyo.com/de-de/apps/01j6a2khp97dshtjctqw5brnqy/'
				}
			]
		},
		{
			category: 'Rechtliches',
			subCategories: [
				{
					subCategory: 'Impressum',
					subCategoryLink: '/legal/impressum'
				},
				{
					subCategory: 'Datenschutz',
					subCategoryLink: '/legal/datenschutz'
				}
			]
		}
	],
	subFooter: {
		copywriteText: '© PostPal Marketing Solutions GmbH 2026.'
	}
}
