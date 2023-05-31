import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC } from 'react';

import { useConfigContext } from '@/lib/context/config';
import { defaultThemes, getTheme } from '@/lib/themes';

import { SelectItem } from '../ui/Select';

type ThemePickerProps = {
  className?: string;
};

export const ThemePicker: FC<ThemePickerProps> = () => {
  const { theme, setTheme } = useConfigContext();

  return (
    <Select.Root
      value={theme.isCustom ? 'Custom' : theme.name}
      onValueChange={(value) => {
        const selectedTheme = getTheme(value);
        if (selectedTheme) {
          setTheme(selectedTheme);
        }
      }}
    >
      <Select.Trigger
        className="button-ring flex w-full flex-row items-center gap-2 rounded-md border border-neutral-900 py-1.5 px-3 text-sm text-neutral-300 outline-none"
        aria-label="Theme"
      >
        <div className="flex-grow truncate whitespace-nowrap text-left">
          <Select.Value placeholder="Pick a theme…" />
        </div>
        <Select.Icon className="flex-none text-neutral-500">
          <ChevronDown className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-30 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
          <Select.ScrollUpButton className="flex h-10 items-center justify-center">
            <ChevronUp className="h-4 w-4" />
          </Select.ScrollUpButton>
          <Select.Viewport>
            <Select.Group>
              {theme.isCustom && <SelectItem value="Custom">Custom</SelectItem>}
              {defaultThemes?.map((theme) => {
                return (
                  <SelectItem key={`theme-${theme.name}`} value={theme.name}>
                    {theme.name}
                  </SelectItem>
                );
              })}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center p-2">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>{' '}
    </Select.Root>
  );
};
