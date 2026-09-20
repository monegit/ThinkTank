# Compound Components

Use a compound component when children form one semantic control and need a shared contract. Typical cases are menus, tabs, dialogs, and selectable groups.

```tsx
<Menu value={value} onChange={handleChange}>
  <Menu.Title>Menu title</Menu.Title>
  <Menu.Items size={10}>
    <Menu.Item value="one">Item one</Menu.Item>
  </Menu.Items>
</Menu>
```

Keep shared selection, identifiers, and keyboard behavior in the root through context. Keep each child responsible for one semantic element. Validate child usage and provide accessible roles, labels, focus handling, and disabled states.

Use a simple component instead when children do not share state or when a small `children`/render prop API is clearer. Do not make consumers rely on child order unless the pattern explicitly requires it.
