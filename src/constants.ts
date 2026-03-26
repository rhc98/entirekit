export const CHECKPOINT_BRANCH = 'entire/checkpoints/v1';

export interface ModelPricing {
  /** Short key used in --model flag */
  key: string;
  displayName: string;
  /** Price per 1K input tokens */
  inputPer1k: number;
  /** Price per 1K output tokens */
  outputPer1k: number;
  /** Price per 1K cache read tokens */
  cacheReadPer1k: number;
  /** Price per 1K cache creation tokens */
  cacheCreatePer1k: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'opus-4.6': {
    key: 'opus-4.6',
    displayName: 'Claude Opus 4.6',
    inputPer1k: 0.005,
    outputPer1k: 0.025,
    cacheReadPer1k: 0.0005,
    cacheCreatePer1k: 0.00625,
  },
  'opus-4.5': {
    key: 'opus-4.5',
    displayName: 'Claude Opus 4.5',
    inputPer1k: 0.005,
    outputPer1k: 0.025,
    cacheReadPer1k: 0.0005,
    cacheCreatePer1k: 0.00625,
  },
  'opus-4': {
    key: 'opus-4',
    displayName: 'Claude Opus 4',
    inputPer1k: 0.015,
    outputPer1k: 0.075,
    cacheReadPer1k: 0.0015,
    cacheCreatePer1k: 0.01875,
  },
  'sonnet-4.6': {
    key: 'sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    inputPer1k: 0.003,
    outputPer1k: 0.015,
    cacheReadPer1k: 0.0003,
    cacheCreatePer1k: 0.00375,
  },
  'sonnet-4.5': {
    key: 'sonnet-4.5',
    displayName: 'Claude Sonnet 4.5',
    inputPer1k: 0.003,
    outputPer1k: 0.015,
    cacheReadPer1k: 0.0003,
    cacheCreatePer1k: 0.00375,
  },
  'sonnet-4': {
    key: 'sonnet-4',
    displayName: 'Claude Sonnet 4',
    inputPer1k: 0.003,
    outputPer1k: 0.015,
    cacheReadPer1k: 0.0003,
    cacheCreatePer1k: 0.00375,
  },
  'haiku-4.5': {
    key: 'haiku-4.5',
    displayName: 'Claude Haiku 4.5',
    inputPer1k: 0.001,
    outputPer1k: 0.005,
    cacheReadPer1k: 0.0001,
    cacheCreatePer1k: 0.00125,
  },
  'haiku-3.5': {
    key: 'haiku-3.5',
    displayName: 'Claude Haiku 3.5',
    inputPer1k: 0.0008,
    outputPer1k: 0.004,
    cacheReadPer1k: 0.00008,
    cacheCreatePer1k: 0.001,
  },
};

export const DEFAULT_MODEL = 'sonnet-4.5';

/** @deprecated Use MODEL_PRICING[DEFAULT_MODEL] instead */
export const PRICING = MODEL_PRICING[DEFAULT_MODEL]!;

export function getModelPricing(model: string): ModelPricing {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    const available = Object.keys(MODEL_PRICING).join(', ');
    throw new Error(`Unknown model '${model}'. Available: ${available}`);
  }
  return pricing;
}
