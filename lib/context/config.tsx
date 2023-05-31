/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react';

import { ModelConfig } from '@/types/types';

import useProject from '../hooks/use-project';
import { useLocalStorage } from '../hooks/utils/use-localstorage';
import { DEFAULT_PROMPT_TEMPLATE } from '../prompt';
import {
  defaultTheme,
  findMatchingTheme,
  Theme,
  ThemeColorKeys,
  ThemeColors,
} from '../themes';
import { objectEquals } from '../utils';

export type State = {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  placeholder: string;
  iDontKnowMessage: string;
  referencesHeading: string;
  loadingHeading: string;
  includeBranding: boolean;
  modelConfig: ModelConfig;
  setColor: (colorKey: ThemeColorKeys, value: string) => void;
  setTheme: (theme: Theme) => void;
  setDark: (dark: boolean) => void;
  setSize: (size: Theme['size']) => void;
  setPlaceholder: (placeholder: string) => void;
  setIDontKnowMessage: (iDontKnowMessage: string) => void;
  setReferencesHeading: (referencesHeading: string) => void;
  setLoadingHeading: (loadingHeading: string) => void;
  setIncludeBranding: (includeBranding: boolean) => void;
  setModelConfig: (modelConfig: ModelConfig) => void;
  resetModelConfigDefaults: () => void;
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: 'gpt-4',
  temperature: 0.1,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 500,
  promptTemplate: DEFAULT_PROMPT_TEMPLATE.template,
  sectionsMatchCount: 10,
  sectionsMatchThreshold: 0.5,
};

const initialState: State = {
  theme: defaultTheme,
  colors: defaultTheme.colors.light,
  isDark: false,
  placeholder: '',
  iDontKnowMessage: '',
  referencesHeading: '',
  loadingHeading: '',
  includeBranding: true,
  modelConfig: DEFAULT_MODEL_CONFIG,
  setColor: () => {},
  setTheme: () => {},
  setDark: () => {},
  setSize: () => {},
  setPlaceholder: () => {},
  setIDontKnowMessage: () => {},
  setReferencesHeading: () => {},
  setLoadingHeading: () => {},
  setIncludeBranding: () => {},
  setModelConfig: () => {},
  resetModelConfigDefaults: () => {},
};

export const isDefaultCustomConfig = (config: ModelConfig) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { model: configModel, ...rest } = config;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { model: defaultModel, ...defaultRest } = initialState.modelConfig;
  return objectEquals(rest, defaultRest);
};

export const CONFIG_DEFAULT_VALUES = {
  placeholder: 'Ask me anything…',
  iDontKnowMessage: 'Sorry, I am not sure how to answer that.',
  referencesHeading: 'Answer generated from the following pages:',
  loadingHeading: 'Fetching relevant pages…',
  includeBranding: true,
  isDark: false,
};

const ConfigContextProvider = (props: PropsWithChildren) => {
  const { project } = useProject();

  const [theme, setTheme] = useLocalStorage<Theme>(
    `${project?.id ?? 'undefined'}:config:theme`,
    defaultTheme,
  );

  const [isDark, setDark] = useLocalStorage<boolean>(
    `${project?.id ?? 'undefined'}:config:model-dark`,
    CONFIG_DEFAULT_VALUES.isDark,
  );

  const [placeholder, setPlaceholder] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:config:placeholder`,
    CONFIG_DEFAULT_VALUES.placeholder,
  );

  const [iDontKnowMessage, setIDontKnowMessage] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:config:i-dont-know-message`,
    CONFIG_DEFAULT_VALUES.iDontKnowMessage,
  );

  const [referencesHeading, setReferencesHeading] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:config:references-heading`,
    CONFIG_DEFAULT_VALUES.referencesHeading,
  );

  const [loadingHeading, setLoadingHeading] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:config:loading-heading`,
    CONFIG_DEFAULT_VALUES.loadingHeading,
  );

  const [includeBranding, setIncludeBranding] = useLocalStorage<boolean>(
    `${project?.id ?? 'undefined'}:config:include-branding`,
    CONFIG_DEFAULT_VALUES.includeBranding,
  );

  const [modelConfig, setModelConfig] = useLocalStorage<ModelConfig>(
    `${project?.id ?? 'undefined'}:config:model-config`,
    initialState.modelConfig,
  );

  const updateOrCreateCustomTheme = useCallback(
    (newTheme: Theme) => {
      const found = findMatchingTheme(newTheme);
      if (found) {
        setTheme(found);
      } else {
        setTheme({
          isCustom: true,
          ...newTheme,
        });
      }
    },
    [setTheme],
  );

  const setColor = useCallback(
    (colorKey: ThemeColorKeys, value: string) => {
      const colors = isDark ? theme.colors.dark : theme.colors.light;
      const updatedTheme = {
        ...theme,
        colors: {
          ...theme.colors,
          [isDark ? 'dark' : 'light']: {
            ...colors,
            [colorKey]: value,
          },
        },
      };
      updateOrCreateCustomTheme(updatedTheme);
    },
    [isDark, theme, updateOrCreateCustomTheme],
  );

  const setSize = useCallback(
    (size: Theme['size']) => {
      const updatedTheme = { ...theme, size };
      updateOrCreateCustomTheme(updatedTheme);
    },
    [theme, updateOrCreateCustomTheme],
  );

  const resetModelConfigDefaults = useCallback(() => {
    setModelConfig(initialState.modelConfig);
  }, [setModelConfig]);

  return (
    <ConfigContext.Provider
      value={{
        theme,
        isDark,
        placeholder,
        iDontKnowMessage,
        referencesHeading,
        loadingHeading,
        includeBranding,
        modelConfig,
        colors: isDark ? theme.colors.dark : theme.colors.light,
        setTheme: updateOrCreateCustomTheme,
        setColor,
        setDark,
        setSize,
        setPlaceholder,
        setIDontKnowMessage,
        setReferencesHeading,
        setLoadingHeading,
        setIncludeBranding,
        setModelConfig,
        resetModelConfigDefaults,
      }}
      {...props}
    />
  );
};

export const useConfigContext = (): State => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error(
      `useConfigContext must be used within a ConfigContextProvider`,
    );
  }
  return context;
};

export const ConfigContext = createContext<State>(initialState);

ConfigContext.displayName = 'ConfigContext';

export const ManagedConfigContext: FC<PropsWithChildren> = ({ children }) => (
  <ConfigContextProvider>{children}</ConfigContextProvider>
);
