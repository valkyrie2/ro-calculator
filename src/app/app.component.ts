import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PrimeNGConfig } from 'primeng/api';
import { AnalyticsService } from './api-services';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    constructor(
        private primengConfig: PrimeNGConfig,
        private router: Router,
        private analytics: AnalyticsService,
    ) { }

    ngOnInit() {
        this.primengConfig.ripple = true;

        // SPA pageview tracking — fires on every in-app route change.
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e) => this.analytics.trackPageview(e.urlAfterRedirects));
    }
}
