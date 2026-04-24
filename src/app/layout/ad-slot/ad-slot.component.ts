import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Reusable Google AdSense slot. Script is loaded in `index.html`.
 * Pushes a new ad into the slot on init.
 *
 * Usage:
 *   <app-ad-slot slot="1332897611" format="auto" [fullWidthResponsive]="true"></app-ad-slot>
 */
@Component({
  selector: 'app-ad-slot',
  templateUrl: './ad-slot.component.html',
  styleUrls: ['./ad-slot.component.scss'],
})
export class AdSlotComponent implements AfterViewInit {
  @Input() slot!: string;
  @Input() client = 'ca-pub-9810320221608750';
  @Input() format = 'auto';
  @Input() fullWidthResponsive = true;
  /** Min height to reserve so layout doesn't shift before ad loads. */
  @Input() minHeight = '60px';
  /** Inline style override for the outer wrapper. */
  @Input() styleOverride = 'display:block';

  @ViewChild('ad', { static: true }) adRef!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    // Skip in dev — AdSense blocks non-approved hosts and logs noise.
    if (!environment.production) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // swallow — script not loaded / adblocker
    }
  }
}
