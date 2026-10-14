// Same Chrome 90 treatment as the website (see ../../postcss.config.mjs).
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      browsers: ["chrome >= 90"],
      stage: 2,
      features: { "cascade-layers": true, "oklab-function": { preserve: true }, "color-mix": { preserve: true }, "nesting-rules": true, "custom-properties": false },
    },
  },
};
