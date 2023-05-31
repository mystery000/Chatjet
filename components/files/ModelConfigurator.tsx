import * as Accordion from '@radix-ui/react-accordion';
import cn from 'classnames';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { ChangeEvent, FC, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { isDefaultCustomConfig, useConfigContext } from '@/lib/context/config';
import useTeam from '@/lib/hooks/use-team';
import { canConfigureModel } from '@/lib/stripe/tiers';

import { ModelPicker } from './ModelPicker';
import { Row } from './PlaygroundDashboard';
import { TemplatePicker } from './TemplatePicker';
import { UpgradeNote } from './UpgradeNote';
import { UpgradeCTA } from '../team/PlanPicker';
import { AccordionContent, AccordionTrigger } from '../ui/Accordion';
import Button, { ButtonOrLinkWrapper } from '../ui/Button';
import { SliderInput } from '../ui/SliderInput';
import { Tag } from '../ui/Tag';
import { NoAutoTextArea } from '../ui/TextArea';

type ModelConfiguratorProps = {
  className?: string;
};

export const ModelConfigurator: FC<ModelConfiguratorProps> = () => {
  const { team } = useTeam();
  const { modelConfig, setModelConfig, resetModelConfigDefaults } =
    useConfigContext();

  const _canConfigureModel = team && canConfigureModel(team);

  const _isDefaultConfig = useMemo(() => {
    return isDefaultCustomConfig(modelConfig);
  }, [modelConfig]);

  const shouldShowCustomConfigNote =
    team && !canConfigureModel(team) && !_isDefaultConfig;

  return (
    <div className="flex flex-col gap-2">
      <Accordion.Root
        type="single"
        value={shouldShowCustomConfigNote ? 'note' : undefined}
        collapsible
      >
        <Accordion.Item className="overflow-hidden" value="note">
          <AccordionContent className="mb-4">
            <UpgradeNote showDialog>
              You can experiment with custom model configurations here. In order
              to use them in production, please upgrade to the Pro plan.
            </UpgradeNote>
          </AccordionContent>
        </Accordion.Item>
      </Accordion.Root>
      <Row label="Model">
        <ModelPicker />
      </Row>
      <Row
        label={
          <div className="flex flex-row items-center gap-2">
            Prompt template
            {!_canConfigureModel && (
              <UpgradeCTA showDialog>
                <ButtonOrLinkWrapper className="mr-1 flex flex-none items-center rounded-full">
                  <Tag color="fuchsia">Pro</Tag>
                </ButtonOrLinkWrapper>
              </UpgradeCTA>
            )}
          </div>
        }
      >
        <TemplatePicker />
      </Row>
      <div className="mt-1 flex w-full flex-col">
        <NoAutoTextArea
          value={modelConfig.promptTemplate}
          className="h-[400px] w-full"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setModelConfig({
              ...modelConfig,
              promptTemplate: event.target.value,
            });
          }}
        />
        <Link
          href="/docs#templates"
          target="_blank"
          rel="noreferrer"
          className="button-ring mt-4 mb-4 flex w-min cursor-pointer flex-row items-center gap-2 truncate whitespace-nowrap rounded-md text-xs text-neutral-300"
        >
          <Info className="h-4 w-4 text-neutral-300" />
          <span className="subtle-underline">Learn more about templates</span>
        </Link>
      </div>
      <Accordion.Root className="mt-2 w-full" type="single" collapsible>
        <Accordion.Item value="options">
          <AccordionTrigger>Advanced configuration</AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="flex flex-col gap-4">
              <SliderInput
                label="Temperature"
                tip={`Determines how confident the model can be in choosing the next word. The higher the value, the more "creative" and random the result. Choose a low value, like 0.1, for most predictable results.`}
                min={0}
                max={1}
                step={0.1}
                value={modelConfig.temperature}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, temperature: value });
                }}
              />
              <SliderInput
                label="Top P"
                tip="An alternative to temperature controlling the diversity of the responses."
                min={0}
                max={1}
                step={0.01}
                value={modelConfig.topP}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, topP: value });
                }}
              />
              <SliderInput
                label="Frequency penalty"
                tip="Parameter for controlling how often the model is allowed to repeat itself. Positive values penalize repetition, negative values encourage it."
                min={0}
                max={2}
                step={0.1}
                value={modelConfig.frequencyPenalty}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, frequencyPenalty: value });
                }}
              />
              <SliderInput
                label="Presence penalty"
                tip="Parameter for controlling the likelihood of generating repetitive or common phrases in a response. By adjusting the presence penalty value, users can influence the model's output to be more diverse and creative. A higher presence penalty discourages the model from using the same tokens or phrases repeatedly, promoting more varied and unique responses. A lower presence penalty values allow the model to generate completions with more frequent or familiar phrases."
                min={0}
                max={2}
                step={0.1}
                value={modelConfig.presencePenalty}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, presencePenalty: value });
                }}
              />
              <SliderInput
                label="Max tokens"
                tip="The maximum number of tokens to generate in the completion. One token is approximately four characters."
                min={50}
                max={1024}
                step={1}
                value={modelConfig.maxTokens}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, maxTokens: value });
                }}
              />
              <SliderInput
                label="Context size"
                tip="The maximum number of sections to include in the prompt context."
                min={1}
                max={50}
                step={1}
                value={modelConfig.sectionsMatchCount}
                setValue={(value) => {
                  setModelConfig({ ...modelConfig, sectionsMatchCount: value });
                }}
              />
              <SliderInput
                label="Context similarity"
                tip="The similarity threshold between the input question and selected sections."
                min={0}
                max={1}
                step={0.1}
                value={modelConfig.sectionsMatchThreshold}
                setValue={(value) => {
                  setModelConfig({
                    ...modelConfig,
                    sectionsMatchThreshold: value,
                  });
                }}
              />
              <div className="mt-2 border-t border-neutral-900 pt-2" />
              <Button
                buttonSize="sm"
                variant="plain"
                onClick={() => {
                  resetModelConfigDefaults();
                  toast.success('Model defaults restored.');
                }}
              >
                Restore model defaults
              </Button>
            </div>
          </AccordionContent>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
};
