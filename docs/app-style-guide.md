# App Style Guide

## Styling

- Use Tailwind utilities for app and component styling. Prefer template classes or shared Tailwind class constants for repeated surfaces.
- Avoid scoped CSS blocks for ordinary layout, spacing, color, borders, shadows, and responsive behavior.
- Keep `app/assets/css/main.css` limited to Tailwind/Nuxt UI imports, global base rules, and theme token overrides that cannot be expressed as component utilities.
- Use Tailwind arbitrary values when the design needs app tokens, `color-mix()`, masks, backdrop filters, or generated pseudo-elements.
- Keep runtime `:style` bindings only for values that are genuinely data-driven, such as live teleprompter font size, line height, transforms, or SVG mask URLs.
