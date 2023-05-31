export type ThemeColors = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  primaryHighlight: string;
  secondaryHighlight: string;
  overlay: string;
  ring: string;
};

type ThemeDimensions = {
  radius: string;
};

export type ThemeColorKeys = keyof ThemeColors;
export type ThemeDimensionKeys = keyof ThemeDimensions;

export type Theme = {
  name: string;
  isCustom?: boolean;
  size?: 'sm' | 'base';
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  dimensions: ThemeDimensions;
};

export const defaultTheme: Theme = {
  name: 'Default',
  size: 'sm',
  colors: {
    light: {
      background: '#FFFFFF',
      foreground: '#171717',
      muted: '#FAFAFA',
      mutedForeground: '#737373',
      border: '#E5E5E5',
      input: '#FFFFFF',
      primary: '#0ea5e9',
      primaryForeground: '#FFFFFF',
      secondary: '#FAFAFA',
      secondaryForeground: '#171717',
      primaryHighlight: '#EC4899',
      secondaryHighlight: '#A855F7',
      overlay: '#00000010',
      ring: '#0EA5E9',
    },
    dark: {
      background: '#050505',
      foreground: '#D4D4D4',
      muted: '#171717',
      mutedForeground: '#737373',
      border: '#262626',
      input: '#FFFFFF',
      primary: '#0ea5e9',
      primaryForeground: '#FFFFFF',
      secondary: '#0E0E0E',
      secondaryForeground: '#FFFFFF',
      primaryHighlight: '#EC4899',
      secondaryHighlight: '#A855F7',
      overlay: '#00000040',
      ring: '#FFFFFF',
    },
  },
  dimensions: {
    radius: '8px',
  },
};

const indigoTheme: Theme = {
  name: 'Indigo',
  size: 'sm',
  colors: {
    light: {
      ...defaultTheme.colors.light,
      primary: '#6366f1',
      primaryHighlight: '#EC4899',
      secondaryHighlight: '#A855F7',
    },
    dark: {
      ...defaultTheme.colors.dark,
      primary: '#6366f1',
      primaryHighlight: '#EC4899',
      secondaryHighlight: '#A855F7',
    },
  },
  dimensions: {
    radius: '8px',
  },
};

const tealTheme: Theme = {
  name: 'Teal',
  size: 'sm',
  colors: {
    light: {
      ...defaultTheme.colors.light,
      primary: '#14b8a6',
      primaryHighlight: '#a3e635',
      secondaryHighlight: '#22d3ee',
    },
    dark: {
      ...defaultTheme.colors.dark,
      primary: '#14b8a6',
      primaryHighlight: '#a3e635',
      secondaryHighlight: '#22d3ee',
    },
  },
  dimensions: {
    radius: '8px',
  },
};

const monoTheme: Theme = {
  name: 'Mono',
  size: 'sm',
  colors: {
    light: {
      ...defaultTheme.colors.light,
      primary: '#000000',
      primaryHighlight: '#D4D4D4',
      secondaryHighlight: '#525252',
      border: '#000000',
    },
    dark: {
      ...defaultTheme.colors.dark,
      primary: '#FFFFFF',
      primaryForeground: '#000000',
      primaryHighlight: '#D4D4D4',
      secondaryHighlight: '#525252',
      border: '#FFFFFF',
    },
  },
  dimensions: {
    radius: '8px',
  },
};

export const getTheme = (name: string): Theme | undefined => {
  return defaultThemes.find((theme) => theme.name === name);
};

const colorsEqual = (colors: ThemeColors, otherColors: ThemeColors) => {
  const keys = Object.keys(colors) as ThemeColorKeys[];
  if (keys.length !== Object.keys(otherColors).length) {
    return false;
  }

  for (const key of keys) {
    if (colors[key].toLowerCase() !== otherColors[key].toLowerCase()) {
      return false;
    }
  }

  return true;
};

const dimensionsEqual = (
  dimensions: ThemeDimensions,
  otherDimensions: ThemeDimensions,
) => {
  const keys = Object.keys(dimensions) as ThemeDimensionKeys[];
  if (keys.length !== Object.keys(otherDimensions).length) {
    return false;
  }

  for (const key of keys) {
    if (dimensions[key] !== otherDimensions[key]) {
      return false;
    }
  }

  return true;
};

export const findMatchingTheme = (themeValues: Omit<Theme, 'name'>) => {
  return defaultThemes.find((t) => {
    return (
      t.size === themeValues.size &&
      colorsEqual(t.colors.light, themeValues.colors.light) &&
      colorsEqual(t.colors.dark, themeValues.colors.dark) &&
      dimensionsEqual(t.dimensions, themeValues.dimensions)
    );
  });
};

export const defaultThemes = [defaultTheme, indigoTheme, tealTheme, monoTheme];
