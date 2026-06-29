import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

/* ------------------------------------------------------------------ */
/* Image URLs                                                          */
/* ------------------------------------------------------------------ */

const HERO_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_113640_ccf3cf97-d447-425b-a134-d7b09fc743fc.png&w=1280&q=85'

const SECTION2_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114219_414dfe80-f15c-4e25-bf52-b13721f4bd88.png&w=1280&q=85'

const SECTION3_IMG1 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115253_c19ab167-8dd5-48b4-967d-b9f0d9d6e8fb.png&w=1280&q=85'

const SECTION3_IMG2 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115237_fc519057-6e87-4abf-999a-9610b8b085b4.png&w=1280&q=85'

const SECTION3_BG =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114355_752ba9e6-0942-4abb-9047-5d9bb16632e9.png&w=1280&q=85'

/* ------------------------------------------------------------------ */
/* Data constants                                                      */
/* ------------------------------------------------------------------ */

const featureBars = ['Advanced Dentistry', 'High Quality Equipment', 'Friendly Staff']

const services = [
  { name: 'Dental\nVeneers', num: '01', active: true },
  { name: 'Dental\nCrowns', num: '02', active: false },
  { name: 'Teeth\nWhitening', num: '03', active: false },
  { name: 'Dental\nImplants', num: null, active: false },
]

const bookingServices = [
  'Dental Veneers',
  'Dental Crowns',
  'Teeth Whitening',
  'Dental Implants',
  'Dental Restoration',
  'General Consultation',
]

// Shared input styling for the booking form — same flat black/white language as the cards.
const INPUT_CLASS =
  'w-full bg-white border border-black/15 rounded-xl px-4 py-3 text-sm md:text-base text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors'

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

interface MaskPosition {
  x: number
  y: number
  sw: number
  sh: number
}

/**
 * Computes, for each card, its top-left offset relative to the section
 * plus the section's full width/height. Recomputes on resize.
 */
function useMaskPositions(
  sectionRef: React.RefObject<HTMLElement>,
  cardsRef: React.MutableRefObject<(HTMLElement | null)[]>,
) {
  const [positions, setPositions] = useState<MaskPosition[]>([])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const compute = () => {
      const sectionRect = section.getBoundingClientRect()
      const sw = sectionRect.width
      const sh = sectionRect.height
      const next: MaskPosition[] = cardsRef.current.map((card) => {
        if (!card) return { x: 0, y: 0, sw, sh }
        const rect = card.getBoundingClientRect()
        return {
          x: rect.left - sectionRect.left,
          y: rect.top - sectionRect.top,
          sw,
          sh,
        }
      })
      setPositions(next)
    }

    compute()

    const ro = new ResizeObserver(() => compute())
    ro.observe(section)

    return () => ro.disconnect()
  }, [sectionRef, cardsRef])

  return positions
}

/**
 * Loads the image and returns how wide it would render if scaled to fill
 * the given section height (preserving aspect ratio).
 */
function useImageWidth(src: string, sectionHeight: number) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])

  if (!naturalSize || naturalSize.h === 0) return 0
  return naturalSize.w * (sectionHeight / naturalSize.h)
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

/**
 * Reveals `count` elements with a staggered upward fade once the container
 * crosses the viewport threshold (fires once).
 */
function useStaggeredReveal(_count: number, threshold = 0.15) {
  const containerRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const getAnimStyle = (index: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
  })

  return { containerRef, getAnimStyle }
}

/* ------------------------------------------------------------------ */
/* MaskedCard                                                          */
/* ------------------------------------------------------------------ */

interface MaskedCardProps {
  bgImage: string
  position?: MaskPosition
  imageWidth: number
  focalX: number
  className?: string
  children?: ReactNode
  cardRef?: (el: HTMLElement | null) => void
  style?: CSSProperties
}

function MaskedCard({
  bgImage,
  position,
  imageWidth,
  focalX,
  className,
  children,
  cardRef,
  style,
}: MaskedCardProps) {
  const pos: MaskPosition = position ?? { x: 0, y: 0, sw: 0, sh: 0 }
  const overflow = imageWidth > pos.sw ? imageWidth - pos.sw : 0
  const focalOffset = overflow * focalX

  const bgStyle: CSSProperties = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: `auto ${pos.sh}px`,
    backgroundPosition: `-${pos.x + focalOffset}px -${pos.y}px`,
    backgroundRepeat: 'no-repeat',
    ...style,
  }

  return (
    <div
      ref={cardRef as React.Ref<HTMLDivElement>}
      className={className}
      style={bgStyle}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Splash screen                                                       */
/* ------------------------------------------------------------------ */

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let step = 0
    const interval = setInterval(() => {
      step += 1
      setCount(step)
      if (step >= 100) {
        clearInterval(interval)
        const exitTimer = setTimeout(() => setExiting(true), 200)
        const doneTimer = setTimeout(() => onComplete(), 900)
        timers.push(exitTimer, doneTimer)
      }
    }, 20)

    const timers: ReturnType<typeof setTimeout>[] = []

    return () => {
      clearInterval(interval)
      timers.forEach((t) => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black">
        {count}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

const navLinks = ['Home', 'Services', 'About', 'Gallery', 'Contact']

function Navbar({ onBook }: { onBook: () => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md">
        {/* Logo */}
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none">
            Dental
          </span>
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none -mt-1.5 md:-mt-2">
            Health
          </span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2">
            quality healthcare
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:block">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-black">Dental Emergency</span>
            <button className="px-6 py-3 bg-white rounded-full border border-black text-sm font-semibold hover:bg-black hover:text-white transition-colors duration-200">
              Menu
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden w-10 h-10 flex items-center justify-center relative"
        >
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col justify-center h-full px-8 gap-1">
            {navLinks.map((link, i) => (
              <a
                key={link}
                href="#"
                onClick={() => setOpen(false)}
                className={`text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: open ? `${100 + i * 60}ms` : '0ms' }}
              >
                {link}
              </a>
            ))}

            <div
              className="mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
              style={{
                transitionDelay: open ? '450ms' : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'translateX(0)' : 'translateX(2rem)',
              }}
            >
              <p className="text-sm font-semibold text-black mb-4">Dental Emergency</p>
              <button
                onClick={() => {
                  setOpen(false)
                  onBook()
                }}
                className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Booking modal                                                       */
/* ------------------------------------------------------------------ */

function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false)

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Reset to the form whenever the modal is reopened.
  useEffect(() => {
    if (open) setSubmitted(false)
  }, [open])

  // Staggered upward fade for each field, mirroring useStaggeredReveal.
  const fieldAnim = (i: number): CSSProperties => ({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${open ? 140 + i * 70 : 0}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${open ? 140 + i * 70 : 0}ms`,
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div
      className={`fixed inset-0 z-[90] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Centering wrapper — bottom sheet on mobile, centered card on desktop */}
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-3 md:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book an appointment"
          className={`pointer-events-auto w-full max-w-3xl max-h-[92vh] bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            open
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 md:translate-y-4 scale-95'
          }`}
        >
          {/* Left visual panel (desktop only) */}
          <div className="relative hidden md:block">
            <img
              src={SECTION3_BG}
              alt="Smiling patient"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative h-full flex flex-col justify-between p-7">
              <span className="text-white text-xs font-semibold">
                Dental Health — Quality Healthcare
              </span>
              <div>
                <h2 className="text-white text-[clamp(2.5rem,4vw,4rem)] font-bold leading-[0.9]">
                  Book
                  <br />
                  Online
                </h2>
                <p className="text-white text-sm font-semibold mt-3 max-w-[240px] leading-5">
                  Reserve your visit in under a minute. We'll call to confirm.
                </p>
              </div>
            </div>
          </div>

          {/* Right form / success panel */}
          <div className="flex flex-col overflow-y-auto p-5 md:p-7">
            {/* Grab handle (mobile) */}
            <div className="md:hidden mx-auto w-10 h-1 rounded-full bg-black/15 mb-4" />

            {/* Header row */}
            <div className="flex items-start justify-between mb-5 md:mb-6">
              <div>
                <h3 className="md:hidden text-[clamp(2rem,9vw,2.75rem)] font-bold leading-[0.9] text-black">
                  Book Online
                </h3>
                <h3 className="hidden md:block text-3xl font-bold leading-none text-black">
                  Request a visit
                </h3>
                <p className="text-xs md:text-sm font-semibold text-black/50 mt-2">
                  Dental Restoration Services
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 w-10 h-10 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4">
                <span className="w-16 h-16 rounded-full border border-black flex items-center justify-center text-black">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 12.5L9.5 18L20 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h4 className="text-2xl md:text-3xl font-bold text-black leading-tight">
                  Appointment requested
                </h4>
                <p className="text-sm font-semibold text-black/50 max-w-[280px]">
                  Thanks! Our team will call you shortly to confirm your slot.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-8 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div style={fieldAnim(0)}>
                  <label className="block text-xs font-semibold text-black mb-1.5">Full name</label>
                  <input required type="text" placeholder="Jane Doe" className={INPUT_CLASS} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={fieldAnim(1)}>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5">Phone</label>
                    <input required type="tel" placeholder="(201) 555-0123" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5">Email</label>
                    <input type="email" placeholder="jane@email.com" className={INPUT_CLASS} />
                  </div>
                </div>

                <div style={fieldAnim(2)}>
                  <label className="block text-xs font-semibold text-black mb-1.5">Service</label>
                  <select required defaultValue="" className={INPUT_CLASS}>
                    <option value="" disabled>
                      Select a service
                    </option>
                    {bookingServices.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldAnim(3)}>
                  <label className="block text-xs font-semibold text-black mb-1.5">
                    Preferred date
                  </label>
                  <input required type="date" className={INPUT_CLASS} />
                </div>

                <button
                  type="submit"
                  style={fieldAnim(4)}
                  className="mt-1 w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
                >
                  Confirm Booking
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const isMobile = useIsMobile()

  /* --- Section 1 --- */
  const section1Ref = useRef<HTMLElement>(null)
  const s1Cards = useRef<(HTMLElement | null)[]>([])
  const s1Positions = useMaskPositions(section1Ref, s1Cards)
  const s1Reveal = useStaggeredReveal(4)
  const s1Height = s1Positions[0]?.sh ?? 0
  const s1ImageWidth = useImageWidth(HERO_IMAGE, s1Height)
  const s1Focal = isMobile ? 0.7 : 0.8

  /* --- Section 2 --- */
  const section2Ref = useRef<HTMLElement>(null)
  const s2Cards = useRef<(HTMLElement | null)[]>([])
  const s2Positions = useMaskPositions(section2Ref, s2Cards)
  const s2Reveal = useStaggeredReveal(4)
  const s2Height = s2Positions[0]?.sh ?? 0
  const s2ImageWidth = useImageWidth(SECTION2_IMAGE, s2Height)
  const s2Focal = isMobile ? 0.65 : 0.8

  /* --- Section 3 --- */
  const s3Reveal = useStaggeredReveal(4)

  // Merge the two refs that both attach to section 1 / section 2.
  const setSection1 = (el: HTMLElement | null) => {
    ;(section1Ref as React.MutableRefObject<HTMLElement | null>).current = el
    ;(s1Reveal.containerRef as React.MutableRefObject<HTMLElement | null>).current = el
  }
  const setSection2 = (el: HTMLElement | null) => {
    ;(section2Ref as React.MutableRefObject<HTMLElement | null>).current = el
    ;(s2Reveal.containerRef as React.MutableRefObject<HTMLElement | null>).current = el
  }

  return (
    <div className="bg-white">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />

      <Navbar onBook={() => setBookingOpen(true)} />

      {/* ============================= SECTION 1 - HERO ============================= */}
      <section
        ref={setSection1}
        className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        {/* Feature bars */}
        {featureBars.map((bar, i) => (
          <MaskedCard
            key={bar}
            bgImage={HERO_IMAGE}
            position={s1Positions[i]}
            imageWidth={s1ImageWidth}
            focalX={s1Focal}
            cardRef={(el) => (s1Cards.current[i] = el)}
            className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
            style={s1Reveal.getAnimStyle(i)}
          >
            <div className="flex items-center justify-center h-full relative z-10">
              <span className="text-black text-lg md:text-3xl font-bold text-center">{bar}</span>
            </div>
          </MaskedCard>
        ))}

        {/* Main hero card */}
        <MaskedCard
          bgImage={HERO_IMAGE}
          position={s1Positions[3]}
          imageWidth={s1ImageWidth}
          focalX={s1Focal}
          cardRef={(el) => (s1Cards.current[3] = el)}
          className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
          style={s1Reveal.getAnimStyle(3)}
        >
          <div className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
            We wish to provide professional dental services
            <br />
            that match the current technologies
          </div>

          <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
            <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">
              Trusted Dentist in West New York
            </span>
            <h1 className="text-black text-[clamp(3rem,11vw,11rem)] font-bold leading-[0.79] tracking-tight">
              Dental
              <br />
              Care
            </h1>
          </div>

          <div className="absolute bottom-6 right-4 md:bottom-10 md:right-8 text-white text-xs md:text-sm font-semibold z-10">
            Free Consultation
          </div>
        </MaskedCard>
      </section>

      {/* ============================= SECTION 2 - SMILE GALLERY ============================= */}
      <section
        ref={setSection2}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
          {/* Card 0 - Top Left */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[0]}
            imageWidth={s2ImageWidth}
            focalX={s2Focal}
            cardRef={(el) => (s2Cards.current[0] = el)}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            style={s2Reveal.getAnimStyle(0)}
          >
            <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10">
              Smile Gallery
            </h2>
            <span className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10">
              Our cosmetic dental work
            </span>
          </MaskedCard>

          {/* Card 1 - Top Right (spans 2 rows) */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[1]}
            imageWidth={s2ImageWidth}
            focalX={s2Focal}
            cardRef={(el) => (s2Cards.current[1] = el)}
            className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            style={s2Reveal.getAnimStyle(1)}
          >
            <div className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10">
              If you want a gorgeous smile,
              <br />
              call us to ask about a smile makeover.
            </div>
            <button className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform">
              Call Us
            </button>
          </MaskedCard>

          {/* Card 2 - Bottom Left */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[2]}
            imageWidth={s2ImageWidth}
            focalX={s2Focal}
            cardRef={(el) => (s2Cards.current[2] = el)}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            style={s2Reveal.getAnimStyle(2)}
          >
            <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10">
              Smile
              <br />
              makeover
            </h2>
          </MaskedCard>

          {/* Card 3 - Bottom Full Width (Services) */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[3]}
            imageWidth={s2ImageWidth}
            focalX={s2Focal}
            cardRef={(el) => (s2Cards.current[3] = el)}
            className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            style={s2Reveal.getAnimStyle(3)}
          >
            <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between ${
                    svc.active ? 'bg-white/90 backdrop-blur-md' : 'bg-white/20 backdrop-blur-xl'
                  }`}
                >
                  <h3
                    className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${
                      svc.active ? 'text-black' : 'text-white'
                    }`}
                  >
                    {svc.name}
                  </h3>
                  {svc.num && (
                    <span
                      className={`self-end w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-xs md:text-sm font-semibold ${
                        svc.active ? 'border-black text-black' : 'border-white text-white'
                      }`}
                    >
                      {svc.num}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </MaskedCard>
        </div>
      </section>

      {/* ============================= SECTION 3 - IMPLANT DENTISTRY ============================= */}
      <section
        ref={s3Reveal.containerRef as React.Ref<HTMLElement>}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-1.5 md:gap-2">
            {/* Heading card */}
            <div
              className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0"
              style={s3Reveal.getAnimStyle(0)}
            >
              <h2 className="text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] text-black">
                Implant
                <br />
                Dentistry
              </h2>
              <p className="text-xs md:text-sm font-semibold text-black">Restore Missing Teeth</p>
            </div>

            {/* Two image cards */}
            <div
              className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0"
              style={s3Reveal.getAnimStyle(1)}
            >
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img
                  src={SECTION3_IMG1}
                  alt="Dental implant procedure"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img
                  src={SECTION3_IMG2}
                  alt="Dental restoration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Consultation card */}
            <div
              className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0"
              style={s3Reveal.getAnimStyle(2)}
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">
                  Consultation
                </p>
                <h3 className="text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                  Dental
                  <br />
                  Restoration
                  <br />
                  Services
                </h3>
              </div>
              <button
                onClick={() => setBookingOpen(true)}
                className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold hover:scale-105 transition-transform"
              >
                Book Online
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0"
            style={s3Reveal.getAnimStyle(3)}
          >
            <img src={SECTION3_BG} alt="Smiling patient" className="w-full h-full object-cover" />

            <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
              {/* Overlay card 1 - white */}
              <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                  The Process
                  <br />
                  of Installing
                  <br />
                  Implants
                </h4>
                <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="rotate-[-45deg]"
                  >
                    <path
                      d="M1 7h12m0 0L8 2m5 5L8 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {/* Overlay card 2 - glass */}
              <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                  Caring
                  <br />
                  for Dental
                  <br />
                  Implants
                </h4>
                <span className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="rotate-[-45deg] text-white"
                  >
                    <path
                      d="M1 7h12m0 0L8 2m5 5L8 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
