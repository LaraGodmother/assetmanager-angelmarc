import { BRAND } from "./theme";

const colors = {
  light: {
    text: "#0f172a",
    tint: BRAND.colors.primary,

    background: "#f8fafc",
    foreground: "#0f172a",

    card: "#ffffff",
    cardForeground: "#0f172a",

    primary: BRAND.colors.primary,
    primaryForeground: "#ffffff",

    secondary: BRAND.colors.primaryLight,
    secondaryForeground: BRAND.colors.primary,

    muted: "#f1f5f9",
    mutedForeground: "#64748b",

    accent: BRAND.colors.accentLight,
    accentForeground: BRAND.colors.accentDark,

    orange: BRAND.colors.accent,
    orangeLight: BRAND.colors.accentLight,

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    success: "#22c55e",
    successForeground: "#ffffff",

    warning: "#f59e0b",
    warningForeground: "#ffffff",

    border: "#e2e8f0",
    input: "#e2e8f0",

    headerBg: BRAND.colors.primary,
    headerText: "#ffffff",
  },

  radius: 12,
};

export default colors;
