import { PresetLabelSchema, PublishNameSchema, PRESET_LABEL_MAX } from './preset.schema';

describe('PresetLabelSchema', () => {
  const valid = (input: string) => PresetLabelSchema.safeParse(input).success;

  it('accepts plain ASCII labels', () => {
    expect(valid('My Build v2 (PvP)')).toBeTrue();
  });

  it('accepts Thai labels without combining marks', () => {
    expect(valid('ทดสอบ')).toBeTrue();
  });

  it('accepts Thai labels with vowel/tone marks', () => {
    // Regression: vowel/tone marks are Unicode category Mark, not Letter,
    // and were rejected by both the old ASCII pattern and \p{L}-only patterns.
    expect(valid('copied เวอร์ชั่นเทพ')).toBeTrue();
    expect(valid('ที่สุดของเวท')).toBeTrue();
  });

  it('accepts other non-Latin scripts', () => {
    expect(valid('プリセット')).toBeTrue();
    expect(valid('프리셋')).toBeTrue();
  });

  it('accepts emoji and common punctuation in build names', () => {
    // Regression: the old allowlist rejected all of these, blocking legitimate
    // build names ("Invalid preset: label: Label has invalid characters").
    expect(valid('Crit Build 🔥')).toBeTrue();
    expect(valid("Sniper's ATK+ (PvP)!")).toBeTrue();
    expect(valid('DPS: 100% & rising')).toBeTrue();
    // ZWJ emoji sequence relies on \p{Cf} (U+200D) staying allowed.
    expect(valid('combo 👨‍👩‍👧 family')).toBeTrue();
  });

  it('rejects angle brackets and control characters', () => {
    expect(valid('evil<script>')).toBeFalse();
    expect(valid('tab\tchar')).toBeFalse();
    expect(valid('new\nline')).toBeFalse();
  });

  it('rejects empty and whitespace-only labels', () => {
    expect(valid('')).toBeFalse();
    expect(valid('   ')).toBeFalse();
  });

  it('enforces the max length', () => {
    expect(valid('a'.repeat(PRESET_LABEL_MAX))).toBeTrue();
    expect(valid('a'.repeat(PRESET_LABEL_MAX + 1))).toBeFalse();
  });
});

describe('PublishNameSchema', () => {
  const valid = (input: string) => PublishNameSchema.safeParse(input).success;

  it('accepts Thai publish names with vowel/tone marks', () => {
    expect(valid('เวอร์ชั่นเทพ')).toBeTrue();
  });

  it('accepts emoji and punctuation', () => {
    expect(valid('Best Build 🔥 (2026)!')).toBeTrue();
  });

  it('rejects angle brackets and control characters', () => {
    expect(valid('evil<script>')).toBeFalse();
    expect(valid('new\nline')).toBeFalse();
  });
});
