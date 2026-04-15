---
name: reference-calculator-frontend
description: Visual and UI conventions for the RO Calculator frontend. Covers the Vela Green dark theme, PrimeNG/PrimeFlex patterns, component styling, layout structure, and template techniques. Use this skill when building or modifying UI in `src/app/layout/pages/ro-calculator/`.
---

# RO Calculator — Frontend Visual Reference

## 1. Theme & Color System

**Theme**: Vela Green (PrimeNG dark theme)  
**Color Scheme**: `dark` (hardcoded in `app.layout.service.ts`)

### CSS Variables

```css
/* Primary (green) */
var(--primary-color)          /* #4CAF50 */
var(--primary-400)
var(--primary-color-text)
var(--primary-color-rgb)      /* 76, 175, 80 — for rgba() */

/* Surfaces (dark backgrounds) */
var(--surface-card)           /* Card background */
var(--surface-ground)         /* Page background */
var(--surface-900)
var(--surface-border)         /* Border color */
var(--surface-hover)          /* Hover state bg */
var(--surface-overlay)

/* Text */
var(--text-color)             /* Primary text */
var(--text-color-secondary)   /* Muted/secondary text */

/* Semantic colors */
var(--blue-600)       var(--red-600)
var(--green-400)      var(--yellow-300)
var(--yellow-400)     var(--yellow-500)
var(--orange-200)     var(--pink-300)
var(--cyan-300)

/* Layout tokens */
var(--border-radius)          /* 12px */
var(--transition-duration)    /* 0.2s */
var(--card-shadow)
var(--font-family)
```

### Element Colors (game-specific)

```css
.property_Water    { color: var(--blue-600); }
.property_Earth    { color: var(--orange-200); }
.property_Fire     { color: var(--red-600); }
.property_Wind     { color: var(--green-400); }
.property_Poison   { color: #4bfe78; }
.property_Holy     { color: var(--yellow-300); }
.property_Dark     { color: #a55feb; }
.property_Ghost    { color: #aaaaaa; }
.property_Undead   { color: black; }
```

---

## 2. PrimeNG Components

Full list of PrimeNG modules imported in `ro-calculator.module.ts`:

| Category | Components |
|----------|-----------|
| **Layout** | AccordionModule, CardModule, DividerModule, FieldsetModule, DialogModule |
| **Input** | DropdownModule, InputNumberModule, InputTextModule, InputTextareaModule, InputSwitchModule, CheckboxModule, RadioButtonModule, MultiSelectModule, CascadeSelectModule, TreeSelectModule, SelectButtonModule, ToggleButtonModule |
| **Data** | TableModule, DataViewModule, ListboxModule, OrderListModule, PaginatorModule |
| **Action** | ButtonModule, SplitButtonModule, BadgeModule, TagModule, RippleModule |
| **Overlay** | ConfirmDialogModule, ToastModule, BlockUIModule, StyleClassModule |

---

## 3. PrimeFlex Utility Patterns

### Grid System

```html
<!-- Two-column layout (min-width: 1500px) -->
<div class="grid grid-nogutter" style="min-width: 1500px">
  <div class="p-fluid col-7">...</div>   <!-- Left: 58% -->
  <div class="col-5">...</div>           <!-- Right: 42% -->
</div>

<!-- Nested grid -->
<div class="grid grid-nogutter">
  <div class="col-4">...</div>
  <div class="col-8">...</div>
</div>

<!-- Responsive grid -->
<div class="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">...</div>
```

### Flex Patterns

```html
<!-- Row with centered items and gap -->
<div class="flex align-items-center gap-2 mb-3">...</div>

<!-- Space between -->
<div class="flex align-items-center justify-content-between mb-2">...</div>

<!-- Column layout -->
<div class="flex flex-column align-items-center gap-2 py-2">...</div>

<!-- Flex wrap -->
<div class="flex flex-wrap align-items-center justify-content-between gap-2">...</div>
```

### Spacing

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight button groups |
| `gap-2` | 8px | Standard element spacing |
| `gap-3` | 12px | Section spacing |
| `mb-2` / `mb-3` | 8px / 12px | Bottom margin |
| `px-1` / `py-0` | 4px / 0 | Compact padding |
| `p-2` | 8px | Card/section padding |

### Typography

```html
<span class="text-sm">0.875rem</span>
<span class="text-lg font-medium">1.125rem medium</span>
<span class="font-bold">Bold</span>
<span class="font-semibold">Semibold</span>
<span class="text-color-secondary">Muted text</span>
<span class="white-space-nowrap">No wrap</span>
```

### Color Utilities

```html
<span class="text-red-500">Error/danger</span>
<span class="text-cyan-300">Info/accent</span>
<span class="text-yellow-400">Warning/result</span>
<span class="text-primary">Theme green</span>
```

---

## 4. Component Styling Conventions

### Background Pattern (dark theme)

Use very subtle white transparency for section backgrounds:

```css
/* Section background */
background: rgba(255, 255, 255, 0.03);

/* Hover state — slightly brighter */
background: rgba(255, 255, 255, 0.06);

/* Primary color tint */
background-color: rgba(var(--primary-color-rgb, 76, 175, 80), 0.15);

/* Result/highlight with yellow */
background-color: rgba(255, 235, 59, 0.08);

/* Loading overlay */
background-color: rgba(0, 0, 0, 0.4);
```

### Border Patterns

```css
/* Subtle row separator */
border-bottom: 1px solid rgba(255, 255, 255, 0.05);

/* Left accent indicator */
border-left: 3px solid transparent;
border-left-color: var(--primary-color);  /* on hover/active */

/* Highlight outline */
outline: 2px solid var(--primary-color);
outline-offset: -1px;

/* Card border */
border: 1px solid var(--surface-border);
```

### Border Radius

```css
border-radius: 4px;    /* Small: rows, inputs, buttons */
border-radius: 12px;   /* Medium: cards, dialogs (var(--border-radius)) */
border-radius: 50%;    /* Circular: icon buttons */
```

### Transitions

```css
transition: background-color 0.15s;
transition: outline 0.15s, background-color 0.15s;
transition: background-color var(--transition-duration);  /* 0.2s */
```

### Font Sizes

```css
font-size: 0.75rem;   /* Extra small: labels, details */
font-size: 0.8rem;    /* Small: secondary info, code */
font-size: 0.9rem;    /* Slightly small: sub-headings */
font-size: 1rem;      /* Normal: body, values */
font-size: 1.15rem;   /* Emphasis: result values */
font-size: 1.25rem;   /* Large: headings */
font-size: 2rem;      /* Extra large: loading spinner */
```

### Monospace (code/data)

```css
font-family: 'Consolas', 'Monaco', monospace;         /* Item scripts */
font-family: 'Courier New', Courier, monospace;       /* Breakdown details */
```

---

## 5. Layout Structure

### Application Shell

```
┌─────────────────────────────── Topbar (fixed, 48px) ──────────────────────────┐
│  Logo  │  Menu Toggle  │  Spacer  │  Topbar Buttons (bell, youtube, profile) │
├────────┼───────────────────────────────────────────────────────────────────────┤
│Sidebar │                                                                      │
│(300px) │                  layout-main-container                               │
│        │                  padding: 3.5rem 2rem 2rem 4rem                      │
│        │                  ┌─────────────────────┐                             │
│        │                  │   <router-outlet>   │                             │
│        │                  └─────────────────────┘                             │
│        │                  Footer                                              │
└────────┴──────────────────────────────────────────────────────────────────────┘
```

### Calculator Page (2-column)

```
┌─────────────────────────── min-width: 1500px ──────────────────────────┐
│ LEFT (col-7, 58%)                    │ RIGHT (col-5, 42%)             │
│                                      │                                │
│ ┌─ Preset Management ─────────────┐  │ ┌─ Skill & Monster ─────────┐ │
│ │ [Name] [Save] [Settings]        │  │ │ Monster / Skill / Element │ │
│ │ [Preset ▼] [Load ▼] [Del]      │  │ └───────────────────────────┘ │
│ └──────────────────────────────────┘  │                                │
│ ┌─ Character Config ───────────────┐  │ ┌─ Battle Damage Summary ───┐ │
│ │ Class / Level / Job              │  │ │ Min/Max/Crit/DPS          │ │
│ └──────────────────────────────────┘  │ │ [Compare view]            │ │
│ ┌─ Base Stats ─────────────────────┐  │ └───────────────────────────┘ │
│ │ STR AGI VIT INT DEX LUK (+job)  │  │                                │
│ │ POW STA WIS SPL CON CRT         │  │ ┌─ Calc Breakdown ──────────┐ │
│ └──────────────────────────────────┘  │ │ Step-by-step formula      │ │
│ ┌─ Equipment ──────────────────────┐  │ │ with hover highlighting   │ │
│ │ Weapon [cards × slots] [refine] │  │ └───────────────────────────┘ │
│ │ Shield / Armor / Garment / Boot │  │                                │
│ │ Head Upper / Mid / Lower        │  │                                │
│ │ Acc L / Acc R                   │  │                                │
│ └──────────────────────────────────┘  │                                │
│ ┌─ Consumables (Accordion) ────────┐  │                                │
│ └──────────────────────────────────┘  │                                │
│ ┌─ Custom Bonus ───────────────────┐  │                                │
│ │ [Compare toggle] [Slot] [Card]  │  │                                │
│ │ Stat modifier rows              │  │                                │
│ │ Item Script JSON                │  │                                │
│ └──────────────────────────────────┘  │                                │
└──────────────────────────────────────┴────────────────────────────────┘
```

---

## 6. PrimeNG Template Patterns

### Dropdown with Custom Templates

```html
<p-dropdown
  [autoDisplayFirst]="false"
  [resetFilterOnHide]="true"
  [options]="itemList"
  [filter]="true"
  filterBy="label"
  scrollHeight="350px"
  [(ngModel)]="itemId"
  [showClear]="true"
  placeholder="Select item"
  appendTo="body"
>
  <ng-template let-item pTemplate="selectedItem">
    <div class="flex gap-1" *ngIf="itemId">
      <img [src]="'assets/demo/images/items/' + item.value + '.png'" />
      <div>{{ item.label }}</div>
    </div>
  </ng-template>
  <ng-template let-item pTemplate="item">
    <div class="flex gap-1">
      <img [src]="'assets/demo/images/items/' + item.value + '.png'" style="width: 19px" />
      <div>{{ item.label }}</div>
    </div>
  </ng-template>
</p-dropdown>
```

### Grouped Dropdown

```html
<p-dropdown
  [options]="bonusGroups"
  [(ngModel)]="row.attr"
  [group]="true"
  [filter]="true"
  filterBy="label"
>
  <ng-template let-group pTemplate="group">
    <span class="font-bold text-sm">{{ group.label }}</span>
  </ng-template>
</p-dropdown>
```

### Table with Templates

```html
<p-table styleClass="p-datatable-striped p-datatable-sm" [value]="data">
  <ng-template pTemplate="header">
    <tr><th>Header</th></tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr><td>{{ item.value }}</td></tr>
  </ng-template>
</p-table>
```

### DataView Grid

```html
<p-dataView [value]="products" layout="grid" [rows]="12" [paginator]="true">
  <ng-template let-product pTemplate="gridItem">
    <div class="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
      <div class="p-2 border-1 surface-border surface-card border-round">
        ...
      </div>
    </div>
  </ng-template>
</p-dataView>
```

---

## 7. Button Patterns

### Severity Classes

```html
<button pButton label="Save"    class="p-button-success"></button>
<button pButton label="Load"    class="p-button-help"></button>
<button pButton label="Delete"  class="p-button-danger"></button>
<button pButton label="Setting" class="p-button-secondary"></button>
<button pButton label="Up"      class="p-button-warning"></button>

<!-- Outlined variant -->
<button pButton label="Clear" class="p-button-danger p-button-outlined"></button>

<!-- Small -->
<button pButton label="Add" class="p-button-sm p-button-success"></button>

<!-- Text/icon-only -->
<button pButton icon="pi pi-times" class="p-button-sm p-button-danger p-button-text"></button>
```

### Common Icons

```
pi pi-plus          Add / New
pi pi-times         Close / Remove
pi pi-trash         Delete / Clear
pi pi-download      Load
pi pi-check         Select / Confirm
pi pi-cog           Settings
pi pi-file-edit     Rename / Edit
pi pi-search        Search
pi pi-bell          Notifications
pi pi-send          Published / Shared
pi pi-arrow-right   Comparison arrow
pi pi-spin pi-spinner   Loading (animated)
```

---

## 8. Hover & Highlighting Conventions

### Interactive Row

```css
.my-row {
  padding: 0.4rem 0.6rem;
  border-left: 3px solid transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.15s, border-color 0.15s;
  cursor: default;
}
.my-row:hover {
  background-color: rgba(255, 255, 255, 0.06);
  border-left-color: var(--primary-color);
}
```

### Active/Selected Highlight

```css
.my-row.active {
  background-color: rgba(var(--primary-color-rgb, 76, 175, 80), 0.15);
  border-left-color: var(--primary-color);
}
```

### Equipment Highlight (cross-component)

```css
.equip-highlight {
  outline: 2px solid var(--primary-color);
  outline-offset: -1px;
  background-color: rgba(76, 175, 80, 0.08);
  border-radius: 4px;
  transition: outline 0.15s, background-color 0.15s;
}
```

### Result Emphasis (yellow)

```css
.result-row {
  border-left-color: var(--yellow-500) !important;
  background-color: rgba(255, 235, 59, 0.08);
}
.result-row .label { color: var(--yellow-400); }
.result-row .value { color: var(--yellow-300); font-size: 1.15rem; }
```

---

## 9. Section Container Pattern

New sections/panels in the calculator should follow this pattern:

```css
.section-container {
  padding: 0.25rem;                      /* Tight inner padding */
}
.section-block {
  padding: 0.5rem;                       /* Block padding */
  background: rgba(255, 255, 255, 0.03); /* Subtle dark-theme surface */
  border-radius: 4px;
}
```

```html
<!-- Section header -->
<div class="flex align-items-center justify-content-between mb-2">
  <span class="text-sm font-bold">Section Title</span>
  <div class="flex gap-1">
    <button pButton icon="pi pi-plus" label="Add"
            class="p-button-sm p-button-success"></button>
  </div>
</div>

<!-- Empty state -->
<div class="text-center p-2 text-color-secondary text-sm">
  No items. Click <strong>Add</strong> to begin.
</div>

<!-- Divider between sections -->
<p-divider></p-divider>

<!-- Sub-section label -->
<div class="mb-2">
  <span class="text-sm font-bold">Sub Title</span>
  <span class="text-xs text-color-secondary ml-2">Helper text</span>
</div>
```

---

## 10. Responsive Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| *(none)* | 0 | Mobile: `col-12` |
| `sm:` | 576px | Tablet: `sm:col-6` |
| `lg:` | 992px | Desktop: `lg:col-4`, sidebar visible |
| `xl:` | 1200px | Wide: `xl:col-3` |

**Calculator note**: The main calculator grid uses `min-width: 1500px` (not responsive). Responsiveness is primarily in the monster data view grid and layout shell sidebar.

### Layout Behavior

- **Desktop (992px+)**: Sidebar visible at 300px, content shifts right
- **Mobile (<992px)**: Sidebar slides in from left with overlay mask
- **Overlay mode**: Sidebar overlays content instead of pushing it

---

## 11. Dialog / Modal Conventions

```html
<p-dialog
  header="Title"
  position="left"
  [modal]="true"
  [(visible)]="isVisible"
  [style]="{ width: '50vw', 'min-width': '1378px', height: '100vh' }"
  [draggable]="false"
  [resizable]="false"
>
  <ng-template pTemplate="content">...</ng-template>
</p-dialog>

<p-confirmDialog
  [position]="'top'"
  [style]="{ width: '25vw' }"
></p-confirmDialog>
```

---

## 12. Validation/Status Message Pattern

```html
<!-- Error message -->
<div *ngIf="errorMsg" class="text-xs mt-1" style="color: var(--red-400)">
  {{ errorMsg }}
</div>

<!-- Success message -->
<div *ngIf="successCondition" class="text-xs mt-1" style="color: var(--green-400)">
  Parsed {{ count }} attribute(s)
</div>

<!-- Helper/info text -->
<span class="text-xs text-color-secondary">
  (supplemental information)
</span>
```

---

## 13. `::ng-deep` Overrides (ViewEncapsulation)

PrimeNG component internals are styled with `:host ::ng-deep`:

```css
/* Accordion padding */
:host ::ng-deep .p-accordion-header-link {
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}

/* Listbox multi-column */
:host ::ng-deep .column_list p-listbox .p-listbox-list {
  columns: 2;
  padding: 0;
}

/* JSON syntax highlighting */
:host ::ng-deep .json_display .string { color: #95c602; }
:host ::ng-deep .json_display .number { color: #f2b619; }
:host ::ng-deep .json_display .key    { color: #fff; }
```

Use sparingly — prefer PrimeFlex utilities and CSS variables when possible.
