// Navigation Bar
// ------------
// Description: The navigation bar data for the website.
export interface Logo {
	src: string
	alt: string
	text: string
}

export interface NavSubItem {
	name: string
	link: string
}

export interface NavItem {
	name: string
	link: string
	submenu?: NavSubItem[]
}

export interface NavAction {
	name: string
	link: string
	style: string
	size: string
}

export interface NavData {
	logo: Logo
	navItems: NavItem[]
	navActions: NavAction[]
}

export const navigationBarData: NavData = {
	logo: {
		src: 'https://cdn.prod.website-files.com/638cb72eb9a23c52a0d461f1/63ca6423a8dd6bb68cbc175e_logo-transparent-dark.png',
		alt: 'PostPal Logo',
		text: 'PostPal'
	},
	navItems: [],
	navActions: [{ name: 'Zur App gehen', link: 'https://www.getpostpal.com/', style: 'primary', size: 'lg' }]
}
