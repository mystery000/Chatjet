import * as Popover from '@radix-ui/react-popover';
import { ChangeEvent, FC, useState } from 'react';
import { RgbaColorPicker } from 'react-colorful';

import { hexToRgba, rgbaToHex } from '@/lib/utils';

import Input from './Input';

const ColorDialog = ({
  color,
  setColor,
}: {
  color: string;
  setColor: (color: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="flex items-center justify-center px-2">
          <button
            className="h-5 w-5 rounded border border-neutral-800"
            style={{ backgroundColor: `#${color}` }}
          />
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="animate-menu-up z-30 mt-2 mr-6 rounded-lg border border-neutral-900 bg-neutral-1000 shadow-2xl sm:w-full">
          <RgbaColorPicker
            color={hexToRgba(color)}
            onChange={(color) => setColor(rgbaToHex(color))}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type ColorPickerInputProps = {
  color?: string;
  setColor?: (color: string) => void;
} & any;

const removeHash = (color: string) => {
  if (color.startsWith('#')) {
    return color.slice(1);
  }
  return color;
};

const toHexColor = (color: string) => {
  return `#${removeHash(color)}`;
};

const ColorPickerInput: FC<ColorPickerInputProps> = ({
  color,
  setColor,
  ...props
}) => {
  return (
    <Input
      {...props}
      className="uppercase"
      value={removeHash(color) || 'ffffff'}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        setColor?.(toHexColor(e.target.value))
      }
      inputSize="sm"
      leftAccessory={
        <span className="relative ml-2 h-6 w-[6px] text-neutral-600">
          <span className="absolute top-0 left-0 bottom-0 flex items-center">
            #
          </span>
        </span>
      }
      rightAccessory={
        <ColorDialog
          color={removeHash(color)}
          setColor={(c) => setColor(toHexColor(c))}
        />
      }
    />
  );
};

export default ColorPickerInput;
