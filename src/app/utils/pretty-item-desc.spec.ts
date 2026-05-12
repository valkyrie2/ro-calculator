import { prettyItemDesc } from './pretty-item-desc';

describe('prettyItemDesc', () => {
  it('returns empty for null/undefined/empty', () => {
    expect(prettyItemDesc(null)).toBe('');
    expect(prettyItemDesc(undefined)).toBe('');
    expect(prettyItemDesc('')).toBe('');
  });

  it('escapes script tags', () => {
    const out = prettyItemDesc('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('escapes img onerror payloads', () => {
    const out = prettyItemDesc('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('escapes ampersand and quotes', () => {
    const out = prettyItemDesc(`A & "B" 'C'`);
    expect(out).toBe('A &amp; &quot;B&quot; &#39;C&#39;');
  });

  it('converts newlines to <br>', () => {
    expect(prettyItemDesc('a\nb')).toBe('a<br>b');
  });

  it('applies hex color codes', () => {
    expect(prettyItemDesc('^FF0000red')).toBe('<font color="#FF0000">red');
  });

  it('does not match malformed (non-hex) color codes', () => {
    const out = prettyItemDesc('^ZZZZZZtext');
    expect(out).toContain('^ZZZZZZ');
    expect(out).not.toContain('<font');
  });

  it('escapes html inside a color-coded segment', () => {
    const out = prettyItemDesc('^FF0000<script>x</script>');
    expect(out).toContain('<font color="#FF0000">');
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });
});
