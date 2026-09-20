# Repository Guidelines

## Project Structure

This Yarn 4/Turborepo workspace contains `apps/desktop` (Electron), `apps/mobile` (Expo), and shared packages under `packages/`. Put cross-platform React Native components in `packages/ui`, CSS entrypoints in `packages/styles`, shared Tailwind configuration in `packages/tailwind-config`, and shared TypeScript configurations in `packages/typescript-config`.

## Development Commands

- `yarn install` installs workspace dependencies.
- `yarn desktop` starts the Electron app.
- `yarn mobile` starts Expo.
- `yarn typecheck` runs TypeScript checks across all workspaces.
- `yarn workspace @think-tank/desktop build` produces the Electron renderer bundle.

## Code and Styling

Use TypeScript and functional React components. Name component files in PascalCase (for example, `AppShell.tsx`) and use NativeWind `className` values for shared UI styling. Keep Electron-only browser code in `apps/desktop/src/renderer` and platform-neutral UI in `packages/ui`.

## Shared Configuration Rules

Shared configuration must be consumed through a workspace package name, never through a relative path. For example, use `"extends": "@think-tank/typescript-config/desktop.json"` in `tsconfig.json`.

## Verification

Run `yarn typecheck` after TypeScript, NativeWind, or workspace-configuration changes. For desktop renderer changes, also run `yarn workspace @think-tank/desktop build`. Include screenshots for visual UI changes in pull requests.
