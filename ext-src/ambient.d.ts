declare module 'karma-chrome-launcher' {
  type OSMap = Record<string, string | null>;
  export const example: ['type', { prototype: { DEFAULT_CMD: OSMap } }];
}

declare module '@chiragrupani/karma-chromium-edge-launcher' {
  type OSMap = Record<string, string | null>;
  export const example: ['type', { prototype: { DEFAULT_CMD: OSMap } }];
}
