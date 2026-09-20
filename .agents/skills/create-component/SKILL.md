---
name: create-component
description: Design, create, or refactor React components in this repository. Use when implementing component APIs, compound components, reusable component children, Tailwind CSS or tailwind-variants styles, component folders, props, or exports.
---

# Create Component

## Workflow

1. Read the applicable `AGENTS.md`, package exports, and nearby components before choosing an API.
2. Use a simple component by default. Use a compound API only when related children need shared state, coordinated behavior, or a clearer semantic tree. Read [references/compound-components.md](references/compound-components.md) first.
3. Create the component under its category and separate the root, reusable child renderers, JSX, styles, public types, state hooks, and pure utilities by responsibility. Read [references/architecture.md](references/architecture.md).
4. Put Tailwind classes in `styles.ts`. Declare every supported visual style as an invariant class or a typed semantic variant; do not expose `className` as a styling escape hatch. Add `cursor-pointer` to every clickable control. For `tailwind-variants`, use the `tailwind-variants-best-practice` skill and read [references/styling.md](references/styling.md).
5. Keep the public API typed, semantic, and accessible. Forward native element props deliberately; supply accessible labels for icon-only controls.
6. Export the public component from its category and package barrels, then run the narrowest type and lint checks.

## Guardrails

- Prefer composition over boolean prop combinations that alter structure.
- Name slots by responsibility (`root`, `label`, `icon`), not by HTML tag or incidental position.
- Keep one responsibility per file. Extract a child only when it is independently reusable or materially simplifies its parent.
- Define props for an extracted child in the parent component's `types.ts`; import that contract into the child instead of declaring it inside the child file.
- Keep component function signatures light: accept `props`, then destructure it as `const { ... } = props` at the top of the function body.
- Move state transitions and event handlers shared by the component tree into a dedicated hook; move pure calculations into a utility module.
- Keep application-specific state and data fetching outside shared UI components.
- Do not introduce a compound API solely for visual grouping.
- Do not accept or forward `className` from a public component API. Omit it from native prop contracts and add a declared semantic variant when consumers need a supported visual difference.
