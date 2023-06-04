import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';

export type MarkpromptConfig = {
  include?: string[];
  exclude?: string[];
  processorOptions?: {
    linkRewrite?: {
      pattern: string;
      replace: string;
      excludeExternalLinks?: boolean;
    };
  };
};

export const MARKPROMPT_CONFIG_SCHEMA: JTDSchemaType<MarkpromptConfig> = {
  optionalProperties: {
    include: { elements: { type: 'string' } },
    exclude: { elements: { type: 'string' } },
    processorOptions: {
      optionalProperties: {
        linkRewrite: {
          properties: {
            pattern: { type: 'string' },
            replace: { type: 'string' },
          },
          optionalProperties: {
            excludeExternalLinks: { type: 'boolean' },
          },
        },
      },
    },
  },
};

const ajv = new Ajv();

export const parse = ajv.compileParser(MARKPROMPT_CONFIG_SCHEMA);
