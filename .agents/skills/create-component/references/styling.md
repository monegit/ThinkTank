# Styling with Tailwind Variants

Declare `tv` styles in `styles.ts`. Use slots when multiple named elements receive the same variant contract.

```tsx
import { tv } from "tailwind-variants";

const actionButtonStyle = tv({
  slots: {
    root: "inline-flex items-center justify-center rounded-lg px-5 py-3",
    content: "text-sm font-medium",
  },
  variants: {
    variant: {
      primary: { root: "bg-slate-800 text-white" },
      error: { root: "bg-red-500 text-white" },
      warning: { root: "bg-yellow-500 text-black" },
      success: { root: "bg-green-500 text-white" },
    },
  },
  defaultVariants: { variant: "primary" },
});

export default actionButtonStyle;
```

Keep invariant classes in slots and model only public design decisions as variants. Apply the same variant values to all relevant slots. Add `cursor-pointer` to slots that render a clickable control. Do not expose `className` overrides; add a typed semantic variant when consumers need a supported visual difference.
