const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../..");
const apps = path.join(workspaceRoot, "apps");
const packages = path.join(workspaceRoot, "packages");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: [
      path.join(apps, "mobile/App.tsx"),
      path.join(apps, "mobile/src/**/*.{js,jsx,ts,tsx}"),
      path.join(apps, "desktop/src/**/*.{js,jsx,ts,tsx}"),
      path.join(packages, "ui/**/*.{js,jsx,ts,tsx}"),
    ],
  },
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
