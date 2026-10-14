// Tailwind v4 emits modern CSS (cascade layers, oklch, color-mix, nesting).
// Older Chromecasts run Chrome 90, which drops @layer rules entirely, so the
// output is rewritten for that browser: layers flattened, colours converted.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      browsers: ["chrome >= 90", "safari >= 15", "firefox >= 100"],
      stage: 2,
      features: {
        "cascade-layers": true,
        "oklab-function": { preserve: true },
        "color-mix": { preserve: true },
        "nesting-rules": true,
        "custom-properties": false,
      },
    },
  },
};

export default config;
