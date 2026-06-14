import { Directive, inject } from '@angular/core';
import { CascadeSelect } from 'primeng/cascadeselect';

/**
 * Disables PrimeNG `p-cascadeSelect`'s hover-focus behaviour to work around an
 * upstream bug.
 *
 * Moving the mouse across cascade levels fires
 * `onOptionMouseMove` -> `changeFocusedOptionIndex` -> `onOptionClick`, where the
 * option index from one level is looked up in another level's `visibleOptions()`.
 * That lookup can return `undefined`, which is then destructured in `onOptionClick`
 * (`const { index, key, level, parentKey } = processedOption`), throwing:
 *   "Cannot destructure property 'index' of 'e' as it is undefined."
 *
 * Turning off `focusOnHover` skips the whole hover-focus path; navigation by click
 * still works. Applied automatically to every `<p-cascadeSelect>` via its element
 * selector (same selector list PrimeNG's component uses).
 *
 * An explicit `[focusOnHover]` binding in a template still wins, because Angular
 * sets bound inputs after this constructor runs.
 */
@Directive({
  // Element selector is intentional: this augments the third-party
  // <p-cascadeSelect> component, mirroring PrimeNG's own selector list.
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'p-cascadeSelect, p-cascadeselect, p-cascade-select',
  standalone: true,
})
export class CascadeSelectNoHoverFocusDirective {
  constructor() {
    inject(CascadeSelect).focusOnHover = false;
  }
}
