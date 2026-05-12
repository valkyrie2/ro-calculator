import { z } from 'zod';

export const GEMINI_DESCRIPTION_MAX = 4_096;
export const GEMINI_NAME_MAX = 200;
export const GEMINI_CARD_PREFIX_MAX = 200;

// eslint-disable-next-line no-control-regex
const stripControlChars = (s: string) => s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');

const SafeText = (max: number) =>
  z
    .string()
    .max(max)
    .transform(stripControlChars);

export const GenerateItemScriptInputSchema = z.object({
  description: SafeText(GEMINI_DESCRIPTION_MAX).optional(),
  name: SafeText(GEMINI_NAME_MAX).optional(),
  itemTypeId: z.number().int().min(0).max(100_000).optional(),
  cardPrefix: SafeText(GEMINI_CARD_PREFIX_MAX).optional(),
  slots: z.number().int().min(0).max(10).optional(),
  compositionPos: z.number().int().min(0).max(100_000).optional(),
});

export type GenerateItemScriptInput = z.infer<typeof GenerateItemScriptInputSchema>;
