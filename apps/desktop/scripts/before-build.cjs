// electron-vite bundles all application dependencies into out/; only Electron
// and Node built-ins remain external. Returning false tells electron-builder
// that node_modules are already handled, so it neither rebuilds nor packages
// the monorepo's React Native, Metro, and other development-time dependencies.
module.exports = async () => false;
