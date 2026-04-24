import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from 'src/app/api-services';
import { BANNERS, BannerConfig } from './banner.config';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent implements OnInit {
  banner: BannerConfig | null = null;

  constructor(private readonly analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.banner = this.pickBanner();
    if (this.banner) {
      this.analytics.track('banner-impression', { id: this.banner.id });
    }
  }

  onClick(): void {
    if (!this.banner) return;
    this.analytics.track('banner-click', { id: this.banner.id });
  }

  private pickBanner(): BannerConfig | null {
    const now = Date.now();
    const active = BANNERS.filter((b) => {
      if (b.startDate && now < Date.parse(b.startDate)) return false;
      if (b.endDate && now > Date.parse(b.endDate)) return false;
      return true;
    });
    if (active.length === 0) return null;
    if (active.length === 1) return active[0];

    // Weighted random pick.
    const total = active.reduce((sum, b) => sum + (b.weight ?? 1), 0);
    let roll = Math.random() * total;
    for (const b of active) {
      roll -= b.weight ?? 1;
      if (roll <= 0) return b;
    }
    return active[0];
  }
}
