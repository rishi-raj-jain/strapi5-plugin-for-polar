export const POLAR_MINIMUMS: Record<string, string> = {
  usd: '$0.50',
  aed: 'AED2.00',
  ars: 'ARS0.50',
  aud: 'A$0.50',
  brl: 'R$0.50',
  cad: 'CA$0.50',
  chf: 'CHF0.50',
  cop: 'COP0.50',
  czk: 'CZK15.00',
  dkk: 'DKK2.50',
  eur: '€0.50',
  gbp: '£0.30',
  hkd: 'HK$4.00',
  huf: 'HUF175.00',
  idr: 'IDR0.50',
  ils: '₪0.50',
  inr: '₹60.00',
  jpy: '¥50',
  krw: '₩50',
  mxn: 'MX$0.10',
  myr: 'MYR2.00',
  nok: 'NOK3.00',
  nzd: 'NZ$0.50',
  php: '₱0.50',
  pln: 'PLN2.00',
  ron: 'RON2.00',
  rub: 'RUB0.50',
  sek: 'SEK3.00',
  sgd: 'SGD0.50',
  thb: 'THB0.10',
  zar: 'ZAR0.50',
}

export const POLAR_CURRENCIES = Object.keys(POLAR_MINIMUMS).sort()

export const shimmerCss = `
  @keyframes polarShimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .polarShimmer {
    background: linear-gradient(90deg, rgba(240,240,240,1) 0%, rgba(250,250,250,1) 50%, rgba(240,240,240,1) 100%);
    background-size: 800px 100%;
    animation: polarShimmer 1.2s ease-in-out infinite;
  }
  `

export const styles = {
  inputFullWidth: { width: '100%' } as const,
  descriptionTextarea: { width: '100%', minHeight: 120 } as const,
  privateNoteTextarea: { width: '100%', minHeight: 110 } as const,
  trialGridStyle: {
    display: 'grid',
    gridTemplateColumns: '1fr 160px',
    gap: 16,
    alignItems: 'start',
  } as const,
  benefitGridStyle: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    alignItems: 'start',
  } as const,
} as const

// Reusable component props (avoid hardcoding props in JSX)
export const ui = {
  // Spacing helpers
  mt2: { marginTop: 2 } as const,
  mt3: { marginTop: 3 } as const,
  mt4: { marginTop: 4 } as const,
  pt4: { paddingTop: 4 } as const,
  pb2: { paddingBottom: 2 } as const,
  pb6: { paddingBottom: 6 } as const,

  // Modal chrome
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'neutral800',
    opacity: 0.4,
    zIndex: 1,
  } as const,
  modalWrapper: {
    display: 'flex',
    style: {
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2,
      pointerEvents: 'none',
    },
  } as const,
  modalCard: {
    background: 'neutral0',
    style: { maxHeight: '70vh', overflowY: 'scroll' as const },
    width: '900px',
    maxWidth: '90%',
    margin: 'auto',
    borderRadius: '8px',
    pointerEvents: 'auto',
    shadow: 'filterShadow',
  } as const,
  modalHeader: { padding: 6 } as const,
  modalBody: { paddingLeft: 6, paddingRight: 6, paddingBottom: 4 } as const,
  modalFooter: { padding: 6, background: 'neutral100' } as const,

  // Form layout
  formStack: { direction: 'column', gap: 6, style: { width: '100%' } } as const,
  field: { width: '100%' } as const,
  fieldLabel: { variant: 'pi', fontWeight: 'bold' } as const,
  buttonRow: { gap: 2, wrap: 'wrap', justifyContent: 'flex-start' } as const,
  stackGap6: { direction: 'column', gap: 6 } as const,
  stackGap4: { direction: 'column', gap: 4 } as const,
  rowGap2Wrap: { gap: 2, wrap: 'wrap' } as const,
  rowGap4Wrap: { gap: 4, wrap: 'wrap' } as const,
  justifyBetween: { justifyContent: 'space-between' } as const,
  justifyEnd: { justifyContent: 'flex-end' } as const,
  justifyStart: { justifyContent: 'flex-start' } as const,
  trialGridBox: { style: styles.trialGridStyle } as const,
  benefitGridBox: { style: styles.benefitGridStyle, marginTop: 4 } as const,
  headingBetaBold: { variant: 'beta', fontWeight: 'bold' } as const,

  // Settings page
  settingsHeader: { direction: 'column', gap: 2, alignItems: 'flex-start', width: '100%' } as const,
  settingsTitle: { variant: 'beta', style: { textAlign: 'left', width: '100%' } } as const,
  settingsSubtitle: {
    variant: 'pi',
    textColor: 'neutral600',
    style: { textAlign: 'left', width: '100%' },
  } as const,
  settingsStack: { style: { display: 'flex', flexDirection: 'column', gap: 20 } } as const,
  helpText: { variant: 'pi', textColor: 'neutral600', style: { marginTop: 4 } } as const,

  // Embed modal
  embedOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'neutral800',
    opacity: 0.4,
    zIndex: 1,
  } as const,
  embedCard: {
    position: 'fixed',
    zIndex: 2,
    top: '50%',
    left: '50%',
    style: { transform: 'translate(-50%, -50%)' },
    width: '900px',
    maxWidth: '92%',
    background: 'neutral0',
    borderRadius: '8px',
    shadow: 'tableShadow',
  } as const,
} as const
