import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC } from 'react';

import { useConfigContext } from '@/lib/context/config';
import { OpenAIModelId, SUPPORTED_MODELS } from '@/types/types';

import { SelectItem } from '../ui/Select';

type ModelPickerProps = {
  className?: string;
};

export const ModelPicker: FC<ModelPickerProps> = () => {
  const { modelConfig, setModelConfig } = useConfigContext();

  return (
    <Select.Root
      value={modelConfig.model}
      onValueChange={(value) => {
        setModelConfig({ ...modelConfig, model: value as OpenAIModelId });
      }}
    >
      <Select.Trigger
        className="button-ring flex w-full flex-row items-center gap-2 rounded-md border border-neutral-900 py-1.5 px-3 text-sm text-neutral-300 outline-none"
        aria-label="Theme"
      >
        <div className="flex-grow truncate whitespace-nowrap text-left">
          <Select.Value placeholder="Pick a model…" />
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
              {SUPPORTED_MODELS.chat_completions.map((m) => {
                return (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                );
              })}
            </Select.Group>
            <Select.Group>
              {SUPPORTED_MODELS.completions.map((m) => {
                return (
                  <SelectItem key={m} value={m}>
                    {m}
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
