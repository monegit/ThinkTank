# ThinkTank

TypeScript, Yarn, and Turborepo monorepo with a shared React Native Web UI.

```sh
corepack yarn install
corepack yarn desktop # starts Electron
corepack yarn mobile  # starts Expo
```

`@think-tank/ui` defines NativeWind `className`-based React Native components shared by Expo and Electron. The desktop Vite renderer maps `react-native` to `react-native-web`.
