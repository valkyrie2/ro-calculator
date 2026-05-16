import { Component, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../api-services';
import { logger } from '../api-services/logger.service';
import { LayoutService } from "./service/app.layout.service";
import { AppSidebarComponent } from "./app.sidebar.component";
import { AppTopBarComponent } from './app.topbar.component';

@Component({
  standalone: false,
    selector: 'app-layout',
    templateUrl: './app.layout.component.html'
})
export class AppLayoutComponent implements OnDestroy {

    overlayMenuOpenSubscription: Subscription;

    passwordRecoverySubscription: Subscription;

    menuOutsideClickListener: any;

    profileMenuOutsideClickListener: any;

    showPasswordResetDialog = false;

    resetPassword = '';

    resetPasswordConfirm = '';

    resetPasswordLoading = false;

    resetPasswordError = '';

    resetPasswordInfo = '';

    @ViewChild(AppSidebarComponent) appSidebar!: AppSidebarComponent;

    @ViewChild(AppTopBarComponent) appTopbar!: AppTopBarComponent;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private readonly authService: AuthService,
    ) {
        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', event => {
                    const isOutsideClicked = !(this.appSidebar.el.nativeElement.isSameNode(event.target) || this.appSidebar.el.nativeElement.contains(event.target) 
                        || this.appTopbar.menuButton.nativeElement.isSameNode(event.target) || this.appTopbar.menuButton.nativeElement.contains(event.target));
                    
                    if (isOutsideClicked) {
                        this.hideMenu();
                    }
                });
            }

            if (!this.profileMenuOutsideClickListener) {
                this.profileMenuOutsideClickListener = this.renderer.listen('document', 'click', event => {
                    const isOutsideClicked = !(this.appTopbar.menu.nativeElement.isSameNode(event.target) || this.appTopbar.menu.nativeElement.contains(event.target)
                        || this.appTopbar.topbarMenuButton.nativeElement.isSameNode(event.target) || this.appTopbar.topbarMenuButton.nativeElement.contains(event.target));

                    if (isOutsideClicked) {
                        this.hideProfileMenu();
                    }
                });
            }

            if (this.layoutService.state.staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.hideMenu();
                this.hideProfileMenu();
            });

        this.passwordRecoverySubscription = this.authService.authStateEvent$.subscribe((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                this.openPasswordResetDialog();
            }
        });
    }

    openPasswordResetDialog() {
        this.resetPassword = '';
        this.resetPasswordConfirm = '';
        this.resetPasswordError = '';
        this.resetPasswordInfo = 'Please choose a new password to finish resetting your account.';
        this.showPasswordResetDialog = true;
    }

    submitPasswordReset() {
        this.resetPasswordError = '';
        this.resetPasswordInfo = '';

        if (!this.resetPassword) {
            this.resetPasswordError = 'New password is required.';
            return;
        }
        if (this.resetPassword.length < 6) {
            this.resetPasswordError = 'New password must be at least 6 characters.';
            return;
        }
        if (this.resetPassword !== this.resetPasswordConfirm) {
            this.resetPasswordError = 'Passwords do not match.';
            return;
        }

        this.resetPasswordLoading = true;
        this.authService.updatePassword(this.resetPassword).subscribe({
            next: ({ error }) => {
                this.resetPasswordLoading = false;
                if (error) {
                    this.resetPasswordError = error.message;
                    return;
                }
                this.showPasswordResetDialog = false;
                this.resetPassword = '';
                this.resetPasswordConfirm = '';
            },
            error: (err) => {
                this.resetPasswordLoading = false;
                logger.error(err);
                this.resetPasswordError = err?.message ?? 'Could not update password.';
            },
        });
    }

    cancelPasswordReset() {
        this.showPasswordResetDialog = false;
        this.resetPassword = '';
        this.resetPasswordConfirm = '';
        this.authService.logout();
    }

    hideMenu() {
        this.layoutService.state.overlayMenuActive = false;
        this.layoutService.state.staticMenuMobileActive = false;
        this.layoutService.state.menuHoverActive = false;
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    hideProfileMenu() {
        this.layoutService.state.profileSidebarVisible = false;
        if (this.profileMenuOutsideClickListener) {
            this.profileMenuOutsideClickListener();
            this.profileMenuOutsideClickListener = null;
        }
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        }
        else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        }
        else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' +
                'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    get containerClass() {
        return {
            'layout-theme-light': this.layoutService.config.colorScheme === 'light',
            'layout-theme-dark': this.layoutService.config.colorScheme === 'dark',
            'layout-overlay': this.layoutService.config.menuMode === 'overlay',
            'layout-static': this.layoutService.config.menuMode === 'static',
            'layout-static-inactive': this.layoutService.state.staticMenuDesktopInactive && this.layoutService.config.menuMode === 'static',
            'layout-overlay-active': this.layoutService.state.overlayMenuActive,
            'layout-mobile-active': this.layoutService.state.staticMenuMobileActive,
            'p-input-filled': this.layoutService.config.inputStyle === 'filled',
            'p-ripple-disabled': !this.layoutService.config.ripple
        }
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.passwordRecoverySubscription) {
            this.passwordRecoverySubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
