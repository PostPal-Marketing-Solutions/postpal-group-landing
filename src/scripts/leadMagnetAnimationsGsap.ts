import { gsap } from 'gsap'

type AnimationGroup = {
	trigger: string
	targets: string[]
	preset: 'hero' | 'section' | 'cards'
}

const ANIMATION_GROUPS: AnimationGroup[] = [
	{
		trigger: '.simple-hero',
		targets: ['.simple-hero__badge', '.simple-hero__copy h1', '.simple-hero__lead', '.simple-hero__form', '.simple-hero__media-card'],
		preset: 'hero'
	},
	{
		trigger: '.simple-lead-stats',
		targets: ['.simple-lead-stats__item'],
		preset: 'cards'
	},
	{
		trigger: '.simple-lead-section',
		targets: ['.simple-lead-section__header', '.simple-lead-module', '.simple-lead-insight'],
		preset: 'cards'
	},
	{
		trigger: '.simple-lead-testimonial-band',
		targets: ['.simple-lead-testimonial'],
		preset: 'section'
	},
	{
		trigger: '.simple-lead-pdf-preview',
		targets: ['.simple-lead-pdf-preview__header', '.simple-lead-pdf-preview__card', '.simple-lead-pdf-preview__capture'],
		preset: 'cards'
	},
	{
		trigger: '.simple-lead-faq',
		targets: ['.simple-lead-faq h2', '.simple-lead-faq__item'],
		preset: 'cards'
	}
]

const isMobile = () => window.matchMedia('(max-width: 768px)').matches

const initMagneticCtas = (root: HTMLElement) => {
	if (window.matchMedia('(pointer: coarse)').matches) {
		return
	}

	const selector = [
		'.simple-hero__form button',
		'.simple-hero__actions a',
		'.simple-lead-pdf-preview__form button',
		'.simple-lead-pdf-preview__actions a'
	].join(', ')

	const ctas = Array.from(root.querySelectorAll<HTMLElement>(selector))
	ctas.forEach((cta) => {
		if (cta.dataset.magneticReady === 'true') {
			return
		}

		cta.dataset.magneticReady = 'true'
		const maxOffset = 3.5

		const reset = () => {
			gsap.to(cta, {
				x: 0,
				y: 0,
				scale: 1,
				duration: 0.3,
				ease: 'power2.out',
				clearProps: 'transform,willChange'
			})
		}

		cta.addEventListener('pointerenter', () => {
			cta.style.willChange = 'transform'
		})

		cta.addEventListener('pointermove', (event) => {
			const rect = cta.getBoundingClientRect()
			const relativeX = (event.clientX - rect.left) / rect.width - 0.5
			const relativeY = (event.clientY - rect.top) / rect.height - 0.5

			gsap.to(cta, {
				x: relativeX * maxOffset,
				y: relativeY * maxOffset - 1,
				scale: 1.01,
				duration: 0.22,
				ease: 'power2.out',
				overwrite: true
			})
		})

		cta.addEventListener('pointerleave', reset)
		cta.addEventListener('blur', reset)
	})
}

const getPresetConfig = (preset: AnimationGroup['preset']) => {
	if (preset === 'hero') {
		return {
			duration: isMobile() ? 0.46 : 0.58,
			distance: isMobile() ? 8 : 12,
			stagger: isMobile() ? 0.05 : 0.065,
			delay: 0.04
		}
	}

	if (preset === 'cards') {
		return {
			duration: isMobile() ? 0.3 : 0.38,
			distance: isMobile() ? 4 : 6,
			stagger: isMobile() ? 0.02 : 0.035,
			delay: 0.02
		}
	}

	return {
		duration: isMobile() ? 0.28 : 0.36,
		distance: isMobile() ? 3 : 5,
		stagger: 0,
		delay: 0
	}
}

const animateSection = (
	section: HTMLElement,
	targets: HTMLElement[],
	preset: AnimationGroup['preset'],
	alreadyVisible: boolean
) => {
	const { duration, distance, stagger, delay } = getPresetConfig(preset)
	const startY = alreadyVisible ? Math.max(2, Math.round(distance / 2)) : distance

	const tl = gsap.timeline({
		defaults: {
			ease: 'power2.out'
		}
	})

	if (preset === 'section') {
		gsap.set(section, { willChange: 'transform' })
		tl.fromTo(
			section,
			{ y: startY },
			{
				y: 0,
				duration,
				clearProps: 'transform,willChange'
			}
		)
		return
	}

	if (targets.length) {
		gsap.set(targets, { willChange: 'transform' })
		tl.fromTo(
			targets,
			{ y: startY },
			{
				y: 0,
				duration,
				stagger,
				clearProps: 'transform,willChange'
			}
		)
	}

	if (preset === 'hero') {
		const heroMedia = section.querySelector<HTMLElement>('.simple-hero__media-card')
		if (heroMedia) {
			gsap.set(heroMedia, { willChange: 'transform' })
			tl.fromTo(
				heroMedia,
				{ y: startY, scale: 0.99 },
				{
					y: 0,
					scale: 1,
					duration: duration + 0.06,
					clearProps: 'transform,willChange'
				},
				delay
			)
		}
	}
}

export const initLeadMagnetAnimationsGsap = (rootSelector = '[data-lead-magnet-gsap]') => {
	const root = document.querySelector<HTMLElement>(rootSelector)
	if (!root || root.dataset.gsapInitialized === 'true') {
		return
	}

	root.dataset.gsapInitialized = 'true'

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return
	}

	initMagneticCtas(root)

	const animatedSections = new WeakSet<Element>()

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting || animatedSections.has(entry.target)) {
					return
				}

				const section = entry.target as HTMLElement
				const targetSelectors = section.dataset.gsapTargets?.split('|') ?? []
				const preset = (section.dataset.gsapPreset as AnimationGroup['preset'] | undefined) ?? 'section'
				const targets = targetSelectors
					.flatMap((selector) => Array.from(section.querySelectorAll<HTMLElement>(selector)))
					.filter((element, index, list) => list.indexOf(element) === index)

				animateSection(section, targets, preset, entry.intersectionRatio > 0.55)

				animatedSections.add(section)
				observer.unobserve(section)
			})
		},
		{
			threshold: 0.22,
			rootMargin: '0px 0px -18% 0px'
		}
	)

	ANIMATION_GROUPS.forEach(({ trigger, targets, preset }) => {
		const section = root.querySelector<HTMLElement>(trigger)
		if (!section) {
			return
		}

		section.dataset.gsapTargets = targets.join('|')
		section.dataset.gsapPreset = preset
		observer.observe(section)
	})
}
