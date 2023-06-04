import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { ChangeEvent, FC, useMemo } from 'react';

import { useConfigContext } from '@/lib/context/config';
import emitter, { EVENT_OPEN_PLAN_PICKER_DIALOG } from '@/lib/events';
import useTeam from '@/lib/hooks/use-team';
import { canEnableInstantSearch, canRemoveBranding } from '@/lib/stripe/tiers';
import { Theme, ThemeColorKeys, ThemeColors } from '@/lib/themes';

import { Row } from './PlaygroundDashboard';
import { ThemePicker } from './ThemePicker';
import { AccordionContent, AccordionTrigger } from '../ui/Accordion';
import { ButtonOrLinkWrapper } from '../ui/Button';
import ColorPickerInput from '../ui/ColorPickerInput';
import Input from '../ui/Input';
import { Tag } from '../ui/Tag';

type ThemeColorPickerProps = {
  colors: ThemeColors;
  colorKey: ThemeColorKeys;
};

const ThemeColorPicker: FC<ThemeColorPickerProps> = ({ colors, colorKey }) => {
  const { setColor } = useConfigContext();

  return (
    <ColorPickerInput
      color={colors[colorKey] || 'FFFFFF'}
      setColor={(color: string) => setColor(colorKey, color)}
    />
  );
};

type UIConfiguratorProps = {
  className?: string;
};

export const UIConfigurator: FC<UIConfiguratorProps> = () => {
  const { team } = useTeam();
  const {
    theme,
    setTheme,
    isDark,
    setDark,
    setSize,
    includeBranding,
    isInstantSearchEnabled,
    placeholder,
    iDontKnowMessage,
    setPlaceholder,
    referencesHeading,
    setIDontKnowMessage,
    setReferencesHeading,
    loadingHeading,
    setLoadingHeading,
    setIncludeBranding,
    setInstantSearchEnabled,
  } = useConfigContext();

  const colors = useMemo(() => {
    return isDark ? theme.colors.dark : theme.colors.light;
  }, [theme, isDark]);

  const _canRemoveBranding = team && canRemoveBranding(team);
  const _canEnableInstantSearch = team && canEnableInstantSearch(team);

  return (
    <div className="flex flex-col gap-2">
      <Row label="Theme">
        <ThemePicker />
      </Row>
      <Row label="Placeholder">
        <Input
          inputSize="sm"
          value={placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setPlaceholder(event.target.value);
          }}
        />
      </Row>
      <Row label="Instant search">
        <div className="flex flex-row items-center justify-end gap-2">
          {!_canEnableInstantSearch && (
            <ButtonOrLinkWrapper
              className="mr-1 flex flex-none items-center rounded-full"
              onClick={() => {
                emitter.emit(EVENT_OPEN_PLAN_PICKER_DIALOG);
              }}
            >
              <Tag color="fuchsia">Pro</Tag>
            </ButtonOrLinkWrapper>
          )}
          <Switch.Root
            className="relative h-5 w-8 flex-none rounded-full border border-neutral-700 bg-neutral-800 disabled:cursor-not-allowed data-[state='checked']:border-green-600 data-[state='checked']:bg-green-600 disabled:data-[state='checked']:opacity-40"
            checked={isInstantSearchEnabled || !_canEnableInstantSearch}
            disabled={!_canEnableInstantSearch}
            onCheckedChange={(b: boolean) => setInstantSearchEnabled(b)}
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-[1px] transform rounded-full bg-white transition data-[state='checked']:translate-x-[13px]" />
          </Switch.Root>
        </div>
      </Row>
      <Row label="Include branding">
        <div className="flex flex-row items-center justify-end gap-2">
          {!_canRemoveBranding && (
            <ButtonOrLinkWrapper
              className="mr-1 flex flex-none items-center rounded-full"
              onClick={() => {
                emitter.emit(EVENT_OPEN_PLAN_PICKER_DIALOG);
              }}
            >
              <Tag color="fuchsia">Enterprise</Tag>
            </ButtonOrLinkWrapper>
          )}
          <Switch.Root
            className="relative h-5 w-8 flex-none rounded-full border border-neutral-700 bg-neutral-800 disabled:cursor-not-allowed data-[state='checked']:border-green-600 data-[state='checked']:bg-green-600 disabled:data-[state='checked']:opacity-40"
            checked={includeBranding || !_canRemoveBranding}
            disabled={!_canRemoveBranding}
            onCheckedChange={(b: boolean) => setIncludeBranding(b)}
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-[1px] transform rounded-full bg-white transition data-[state='checked']:translate-x-[13px]" />
          </Switch.Root>
        </div>
      </Row>
      <Accordion.Root className="mt-2 w-full" type="single" collapsible>
        <Accordion.Item value="options">
          <AccordionTrigger>Advanced configuration</AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="flex flex-col gap-2">
              <Row label="Size">
                <ToggleGroup.Root
                  className="grid w-full grid-cols-2 overflow-hidden rounded border border-neutral-800 bg-neutral-1000 text-xs font-medium text-neutral-300"
                  type="single"
                  value={theme.size}
                  onValueChange={(value) => {
                    setSize(value as Theme['size']);
                  }}
                  aria-label="Mode"
                >
                  <ToggleGroup.Item
                    className="px-2 py-1.5 text-center transition data-[state='on']:bg-neutral-900 data-[state='on']:text-neutral-300 data-[state='off']:text-neutral-500"
                    value="sm"
                    aria-label="Small"
                  >
                    Small
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    className="px-2 py-1.5 text-center transition data-[state='on']:bg-neutral-900 data-[state='on']:text-neutral-300 data-[state='off']:text-neutral-500"
                    value="base"
                    aria-label="Base"
                  >
                    Base
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </Row>
              <Row className="mb-2 mt-4" label="Show colors for">
                <ToggleGroup.Root
                  className="grid w-full grid-cols-2 overflow-hidden rounded border border-neutral-800 bg-neutral-1000 text-xs font-medium text-neutral-300"
                  type="single"
                  value={isDark ? 'dark' : 'light'}
                  onValueChange={(value) => {
                    setDark(value === 'dark');
                  }}
                  aria-label="Mode"
                >
                  <ToggleGroup.Item
                    className="px-2 py-1.5 text-center transition data-[state='on']:bg-neutral-900 data-[state='on']:text-neutral-300 data-[state='off']:text-neutral-500"
                    value="light"
                    aria-label="Light mode"
                  >
                    Light
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    className="px-2 py-1.5 text-center transition data-[state='on']:bg-neutral-900 data-[state='on']:text-neutral-300 data-[state='off']:text-neutral-500"
                    value="dark"
                    aria-label="Dark mode"
                  >
                    Dark
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </Row>
              <Row label="Background">
                <ThemeColorPicker colors={colors} colorKey="background" />
              </Row>
              <Row label="Foreground">
                <ThemeColorPicker colors={colors} colorKey="foreground" />
              </Row>
              {/* Muted colors of content */}
              <Row label="Muted">
                <ThemeColorPicker colors={colors} colorKey="muted" />
              </Row>
              <Row label="Muted foreground">
                <ThemeColorPicker colors={colors} colorKey="mutedForeground" />
              </Row>
              <Row label="Border">
                <ThemeColorPicker colors={colors} colorKey="border" />
              </Row>
              {/* <Row label="Input">
                <ThemeColorPicker colors={colors} colorKey="input" />
              </Row> */}
              {/* Primary colors for buttons */}
              <Row label="Primary">
                <ThemeColorPicker colors={colors} colorKey="primary" />
              </Row>
              <Row label="Primary foreground">
                <ThemeColorPicker
                  colors={colors}
                  colorKey="primaryForeground"
                />
              </Row>
              {/* Secondary colors for buttons */}
              <Row label="Secondary">
                <ThemeColorPicker colors={colors} colorKey="secondary" />
              </Row>
              <Row label="Secondary foreground">
                <ThemeColorPicker
                  colors={colors}
                  colorKey="secondaryForeground"
                />
              </Row>
              <Row label="Primary highlight">
                <ThemeColorPicker colors={colors} colorKey="primaryHighlight" />
              </Row>
              <Row label="Secondary highlight">
                <ThemeColorPicker
                  colors={colors}
                  colorKey="secondaryHighlight"
                />
              </Row>
              <Row label="Overlay">
                <ThemeColorPicker colors={colors} colorKey="overlay" />
              </Row>
              {/* Border radius for card, input and buttons */}
              {/* <Row label="Ring">
                <ThemeColorPicker colors={colors} colorKey="ring" />
              </Row> */}
              {/* Border radius for card, input and buttons */}
              <Row label="Radius">
                <Input
                  inputSize="sm"
                  value={theme.dimensions.radius}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    try {
                      const radius = event.target.value;
                      setTheme({
                        ...theme,
                        dimensions: {
                          ...theme.dimensions,
                          radius,
                        },
                      });
                    } catch {
                      //
                    }
                  }}
                />
              </Row>
              <Row className="mt-4" label="Don't know message">
                <Input
                  inputSize="sm"
                  value={iDontKnowMessage}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setIDontKnowMessage(event.target.value);
                  }}
                />
              </Row>
              <Row label="References heading">
                <Input
                  inputSize="sm"
                  value={referencesHeading}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setReferencesHeading(event.target.value);
                  }}
                />
              </Row>
              <Row label="Loading heading">
                <Input
                  inputSize="sm"
                  value={loadingHeading}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setLoadingHeading(event.target.value);
                  }}
                />
              </Row>
            </div>
          </AccordionContent>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
};
