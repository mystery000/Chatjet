import * as Slider from '@radix-ui/react-slider';
import cn from 'classnames';
import { ChangeEvent, FC } from 'react';

import Input from './Input';
import { Row } from '../files/PlaygroundDashboard';

type SliderInputProps = {
  label: string;
  tip?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  setValue: (value: number) => void;
  className?: string;
};

export const SliderInput: FC<SliderInputProps> = ({
  label,
  tip,
  min,
  max,
  step,
  value,
  setValue,
  className,
  ...props
}) => {
  return (
    <div className={cn(className, 'flex flex-col gap-2')}>
      <Row label={label} tip={tip}>
        <Input
          {...props}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            try {
              setValue?.(
                Math.max(min, Math.min(max, parseInt(e.target.value))),
              );
            } catch {
              //
            }
          }}
          inputSize="sm"
        />
      </Row>
      <div className="col-span-2">
        <Slider.Root
          onValueChange={([p]) => {
            setValue(p);
          }}
          className="relative flex h-5 w-full select-none items-center"
          value={[value]}
          min={min}
          max={max}
          step={step}
          aria-label={label}
        >
          <Slider.Track className="relative h-1 flex-grow rounded-full bg-white/20">
            <Slider.Range className="absolute h-full rounded-full bg-white" />
          </Slider.Track>
          <Slider.Thumb className="block h-5 w-5 rounded-full border-4 border-neutral-1100 bg-white ring-offset-0 transition duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 active:bg-fuchsia-500 active:ring-2" />
        </Slider.Root>
      </div>
    </div>
  );
};

SliderInput.displayName = 'SliderInput';
