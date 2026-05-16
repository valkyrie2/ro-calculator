import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { AnalyticsService } from './api-services';

@Component({
  standalone: false,
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    constructor(
        private primengConfig: PrimeNG,
        private router: Router,
        private analytics: AnalyticsService,
    ) { }

    ngOnInit() {
        document.documentElement.classList.add('layout-theme-dark');

        this.primengConfig.setConfig({
            ripple: true,
            theme: {
                preset: Lara,
                options: {
                    darkModeSelector: '.layout-theme-dark',
                },
            },
        });

        // SPA pageview tracking — fires on every in-app route change.
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e) => this.analytics.trackPageview(e.urlAfterRedirects));
    }
}
