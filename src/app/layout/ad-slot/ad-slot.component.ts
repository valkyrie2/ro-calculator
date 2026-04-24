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
  /** Leave empty for fixed-size ads (with `width`/`height`). Use 'auto' for responsive. */
  @Input() format = '';
  @Input() fullWidthResponsive = false;
  /** Fixed width in px. When set, renders `display:inline-block`. */
  @Input() width?: number;
  /** Fixed height in px. */
  @Input() height?: number;

  @ViewChild('ad', { static: true }) adRef!: ElementRef<HTMLElement>;

  get style(): string {
    if (this.width && this.height) {
      return `display:inline-block;width:${this.width}px;height:${this.height}px`;
    }
    return 'display:block';
  }

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
