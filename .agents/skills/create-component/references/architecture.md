# Component Architecture

Choose the destination from the host project's architecture and follow the closest existing component category. Keep reusable UI separate from route- or feature-specific components when the project defines that boundary.

```
src/
└── components/
    └── Button/
        └── ActionButton/
            ├── index.tsx       # JSX and behavior
            ├── styles.ts        # tailwind-variants declaration
            ├── types.ts         # public props and local types
            ├── components/      # reusable child renderers
            ├── hooks/           # state and event handlers
            └── utils/           # pure calculations
```

Use `index.tsx` for the component tree and interactions, `styles.ts` for classes, and `types.ts` for the exported prop contract. Follow the host project's export conventions; do not export internal-only children.

Define every component props contract with an `interface`; do not use a type alias for component props. Add JSDoc to every props interface and each property it declares. The interface JSDoc must describe only the component itself from an external consumer's perspective. Each property JSDoc must briefly describe the behavior or value it exposes, without implementation details.

When extracting a reusable child renderer, define its props interface in the parent component's `types.ts` beside the root props contract. Import that interface into the child component rather than declaring props in the child file. Export the child props type only when another component needs to consume it.

Do not expose `className` as part of a public component API or forward it from native element props. Declare all supported visual styles in `styles.ts`: keep shared classes invariant, and define typed semantic variants for intentional visual differences. Omit `className` from native prop contracts and add or extend a declared variant instead of allowing consumer-side style overrides.

Keep each renderer small. Extract a child when it owns a distinct visual or interaction responsibility, such as a header, item, section, or list. Keep state coordination and related handlers in `hooks/`; keep deterministic transformations in `utils/`.

For every element that performs a click action, declare `cursor-pointer` in its `styles.ts` class definition. Keep disabled-state cursor styles explicit when relevant.

Keep component declarations concise by accepting a `props` object and destructuring it at the start of the function body:

```tsx
const ActionButton = (props: ActionButtonProps) => {
  const { variant, children, ...buttonProps } = props;

  return <button {...buttonProps}>{children}</button>;
};
```

Prefer a narrow native-prop contract when it is useful:

```ts
/** A button that executes a user's primary action. */
interface ActionButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  /** Sets the visual emphasis for the action. */
  variant?: "primary" | "error" | "warning" | "success";
}
```

Use a dedicated options object only when the component has a compelling API reason to separate native attributes.
