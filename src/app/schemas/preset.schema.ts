import { z } from 'zod';

// Display names (labels, publish names) are free-form: users put emoji and
// punctuation (e.g. "Sniper's ATK+ Build 🔥") in build names, and labels span
// every script (Thai vowel/tone marks, CJK, etc.). These values are only ever
// shown via Angular interpolation (auto-escaped) and stored via parameterized
// queries, so there is no injection sink to guard. We therefore allow everything
// EXCEPT control characters (\p{Cc}, incl. tab/newline) and angle brackets
// (`<`/`>` kept out as cheap defence-in-depth). An allowlist here only produced
// false positives. \p{Cf} (zero-width joiner) stays allowed so emoji ZWJ
// sequences keep working.
const DISPLAY_NAME_PATTERN = /^[^\p{Cc}<>]+$/u;
const PRESET_TAG_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const PRESET_LABEL_MAX = 60;
export const PRESET_TAG_MAX = 24;
export const PRESET_MODEL_BYTES_MAX = 65_536;

export const PresetLabelSchema = z
  .string()
  .trim()
  .min(1, 'Label is required')
  .max(PRESET_LABEL_MAX, `Label must be \u2264 ${PRESET_LABEL_MAX} chars`)
  .regex(DISPLAY_NAME_PATTERN, 'Label has invalid characters');

export const PresetTagSchema = z
  .string()
  .trim()
  .min(1, 'Tag is required')
  .max(PRESET_TAG_MAX, `Tag must be \u2264 ${PRESET_TAG_MAX} chars`)
  .regex(PRESET_TAG_PATTERN, 'Tag must be alphanumeric, dash or underscore');

export const PresetTagListSchema = z.array(PresetTagSchema).max(20, 'Too many tags');

export const PresetModelSchema = z
  .unknown()
  .refine((v) => v !== null && typeof v === 'object' && !Array.isArray(v), {
    message: 'Preset model must be an object',
  })
  .refine(
    (v) => {
      try {
        return new TextEncoder().encode(JSON.stringify(v)).length <= PRESET_MODEL_BYTES_MAX;
      } catch {
        return false;
      }
    },
    { message: `Preset model exceeds ${PRESET_MODEL_BYTES_MAX} bytes` },
  );

export const CreatePresetSchema = z.object({
  label: PresetLabelSchema,
  model: PresetModelSchema,
});

export const UpdatePresetSchema = z.object({
  label: PresetLabelSchema.optional(),
  model: PresetModelSchema.optional(),
});

export const PublishNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(DISPLAY_NAME_PATTERN, 'Publish name has invalid characters');

export type PresetLabel = z.infer<typeof PresetLabelSchema>;
export type PresetTag = z.infer<typeof PresetTagSchema>;
