import { TestBed } from '@angular/core/testing';
import { CascadeSelect } from 'primeng/cascadeselect';
import { CascadeSelectNoHoverFocusDirective } from './cascade-select-no-hover-focus.directive';

describe('CascadeSelectNoHoverFocusDirective', () => {
  it('disables focusOnHover on the host p-cascadeSelect (avoids the upstream hover crash)', () => {
    // PrimeNG defaults focusOnHover to true; the directive must flip it off.
    const host = { focusOnHover: true } as unknown as CascadeSelect;

    TestBed.configureTestingModule({
      providers: [{ provide: CascadeSelect, useValue: host }, CascadeSelectNoHoverFocusDirective],
    });

    // Resolving the directive constructs it in the injection context, where it
    // injects the host CascadeSelect above and turns focusOnHover off.
    TestBed.inject(CascadeSelectNoHoverFocusDirective);

    expect(host.focusOnHover).toBe(false);
  });
});
