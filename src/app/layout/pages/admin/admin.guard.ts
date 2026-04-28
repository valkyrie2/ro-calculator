import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from 'src/app/api-services';

/**
 * Route guard that restricts /admin to logged-in users with role='admin'.
 * Non-admins are bounced to the calculator home page. We use the cached
 * `isAdmin$` stream (which already debounces with `distinctUntilChanged`)
 * and take(1) so the guard resolves once Supabase has hydrated the
 * profile.
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isAdmin$.pipe(
      take(1),
      map((isAdmin) => isAdmin || this.router.parseUrl('/')),
    );
  }
}
