import { z } from 'zod';

export const ClassIdSchema = z.coerce.number().int().min(0).max(10_000).default(0);

export const TagNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const PagingSkipSchema = z.coerce.number().int().min(0).max(100_000).default(0);
export const PagingTakeSchema = z.coerce.number().int().min(1).max(100).default(20);

export const SharedPresetQuerySchema = z.object({
  classId: ClassIdSchema.optional(),
  tagName: TagNameSchema.optional(),
  skip: PagingSkipSchema.optional(),
  take: PagingTakeSchema.optional(),
});

export const ErrorDescriptionSchema = z.string().max(500).optional();

export type SharedPresetQuery = z.infer<typeof SharedPresetQuerySchema>;
