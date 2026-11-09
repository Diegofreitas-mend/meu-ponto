export const Brand = {
  colors: {
    green: '#16A34A',
    blue: '#2563EB',
    yellow: '#FACC15',
    ink: '#14251D',
    muted: '#52645A',
    canvas: '#F5F8F6',
    white: '#FFFFFF',
  },
  themes: {
    light: {
      background: '#F5F8F6', surface: '#FFFFFF', text: '#14251D',
      textSecondary: '#52645A', border: '#CBD5CE',
      primary: '#2563EB', onPrimary: '#FFFFFF',
      success: '#166534', successSurface: '#DCFCE7',
      warning: '#854D0E', warningSurface: '#FEF9C3',
      danger: '#B91C1C', dangerSurface: '#FEE2E2',
      focus: '#2563EB', disabled: '#E2E8E4', onDisabled: '#52645A',
    },
    dark: {
      background: '#0C1812', surface: '#14251D', text: '#F5F8F6',
      textSecondary: '#B5C8BC', border: '#52645A',
      primary: '#93B4FF', onPrimary: '#102653',
      success: '#86EFAC', successSurface: '#12351F',
      warning: '#FACC15', warningSurface: '#382C0C',
      danger: '#FCA5A5', dangerSurface: '#421A1A',
      focus: '#FACC15', disabled: '#24382D', onDisabled: '#B5C8BC',
    },
  },
  home: {
    background: '#FFFFFF',
    card: '#EAF3FF',
    cardBorder: '#C7DDFB',
    iconSurface: '#D6E7FF',
    text: '#15345B',
    textSecondary: '#48617E',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 },
  radius: { input: 12, card: 20, pill: 999 },
  typography: {
    display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
    title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    subtitle: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  },
  control: { minHeight: 48, iconSize: 24, iconStroke: 2 },
  motion: { quick: 150, standard: 220 },
} as const;

export type BrandTheme = keyof typeof Brand.themes;

// Cores usadas pelas telas atuais: fundo branco e cards azuis.
export const colors = { ...Brand.themes.light, ...Brand.home };
