export const THEME_COLORS = {
  dark: {
    background: '#0B0B0D',
    backgroundSecondary: '#FFFAF5',
    text: 'text-zinc-200',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-400',
    border: 'border-white/30',
    borderLight: 'border-white/10',
    buttonBg: 'bg-white/10',
    buttonBgHover: 'bg-white/20',
    cardBg: 'bg-white/[0.03]',
    inputBg: 'bg-white/[0.03]',
    codeBg: 'bg-zinc-800',
    codeText: 'text-zinc-200',
    linkText: 'text-blue-400',
    linkTextHover: 'text-blue-300',
  },
  light: {
    background: '#FFFAF5',
    backgroundSecondary: '#FFF8F0',
    text: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-500',
    border: 'border-gray-300',
    borderLight: 'border-amber-200/50',
    buttonBg: 'bg-amber-100',
    buttonBgHover: 'bg-amber-200',
    cardBg: 'bg-[#FFF8F0]',
    inputBg: 'bg-[#FFF8F0]',
    codeBg: 'bg-gray-100',
    codeText: 'text-gray-900',
    linkText: 'text-blue-600',
    linkTextHover: 'text-blue-700',
  }
} as const;

export const FONT_STYLES = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '15px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.6',
  }
} as const;

export const TIMING = {
  debounce: {
    typing: 1500,
    search: 300,
    save: 500,
  },
  animation: {
    fast: 100,
    normal: 200,
    slow: 800,
  },
  delay: {
    toolbarShow: 1000,
    autoPreview: 5000,
  }
} as const;

export const SPACING = {
  toolbarOffset: 50,
  maxHistory: 50,
  maxCharPreview: 100,
} as const;

export const getThemeClasses = (isDarkMode: boolean) => {
  const theme = isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;
  return {
    background: theme.background,
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    border: theme.border,
    borderLight: theme.borderLight,
    button: `${theme.buttonBg} hover:${theme.buttonBgHover}`,
    card: theme.cardBg,
    input: theme.inputBg,
    code: `${theme.codeBg} ${theme.codeText}`,
    link: `${theme.linkText} hover:${theme.linkTextHover}`,
  };
};