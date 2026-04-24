/**
 * Banner config — drop entries here to display on the topbar.
 *
 * - `src` is a path under `src/assets/...`.
 * - `href` opens in a new tab when the banner is clicked. Omit to make it non-clickable.
 * - `startDate` / `endDate` are ISO strings; the banner is hidden outside that window.
 * - `weight` biases random selection when multiple banners are active.
 */
export interface BannerConfig {
  id: string;
  src: string;
  href?: string;
  alt: string;
  /** ISO date string. Banner inactive before this. */
  startDate?: string;
  /** ISO date string. Banner inactive after this. */
  endDate?: string;
  /** Selection weight when multiple are active (default 1). */
  weight?: number;
  /** Inline width override (CSS string, e.g. '160px'). */
  width?: string;
}

export const BANNERS: BannerConfig[] = [
  {
    id: 'emuto-shop',
    src: 'assets/demo/images/others/banner/emutoShop.png',
    alt: 'Emuto Shop',
    width: '260px',
  },
];
