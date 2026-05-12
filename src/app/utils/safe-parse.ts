import type { ZodType } from 'zod';

export interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

export interface SafeParseFailure {
  success: false;
  error: string;
  issues: { path: string; message: string }[];
}

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export function safeParse<T>(schema: ZodType<T>, input: unknown): SafeParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }));
  return {
    success: false,
    error: issues.map((i) => `${i.path}: ${i.message}`).join('; '),
    issues,
  };
}

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown, context = 'input'): T {
  const r = safeParse(schema, input);
  if (!r.success) throw new Error(`Invalid ${context}: ${(r as SafeParseFailure).error}`);
  return r.data;
}
