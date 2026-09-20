# create-component

[English](README.md) | [한국어](README.ko.md)

## Purpose

Use this skill to design, create, and refactor React components with a consistent structure and public API. It covers compound components, reusable child components, `tailwind-variants` styling, types, and exports.

## When to Use

Use this skill when creating a new UI component or improving an existing component's API, structure, or styling. It is also suitable for components such as menus, tabs, and dialogs whose child elements share state or behavior.

## Usage

Include the skill name in the request.

```text
Use $create-component to implement a reusable profile menu component.
```

Also use `$tailwind-variants-best-practice` when styling with `tailwind-variants`.

## File Structure

Follow the target project's architecture for the component location, and separate internal files by responsibility.

```text
src/
└── components/
    └── Button/
        └── ActionButton/
            ├── index.tsx  # JSX and behavior
            ├── styles.ts  # Style declarations
            ├── types.ts   # Public props and types
            ├── components/ # Reusable child renderers
            ├── hooks/      # State and related handlers
            └── utils/      # Pure calculations
```

## Implementation Rules

- Keep the root component focused on composition and public API. Extract children that have an independent visual or interaction responsibility.
- Put coordinated state transitions and handlers in `hooks/`, and deterministic calculations in `utils/`.
- Accept a `props` object in each component function, then destructure it at the beginning of the function body.
- Define component props with an `interface`, not a type alias. Add JSDoc to every props interface and each property it declares.
- Describe the component in its interface JSDoc from an external consumer's perspective. Describe each property as an exposed behavior or value, without implementation details.
- Do not accept or forward `className` from a public component API. Declare all supported styles in `styles.ts` through invariant classes or typed semantic variants.
- Omit `className` from native prop contracts. Add or extend a declared variant instead of allowing consumer-side style overrides.
- Add `cursor-pointer` to the declared style of every clickable control.
- Define an extracted child renderer's props interface in the parent component's `types.ts`, then import it into the child instead of declaring props inside the child file.
