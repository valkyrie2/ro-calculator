const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);

const COLOR_CODE = /\^([0-9a-fA-F]{6})/g;

export const prettyItemDesc = (desc: string | null | undefined): string => {
  if (!desc) return '';
  const escaped = escapeHtml(desc);
  return escaped.replaceAll('\n', '<br>').replace(COLOR_CODE, '<font color="#$1">');
};
