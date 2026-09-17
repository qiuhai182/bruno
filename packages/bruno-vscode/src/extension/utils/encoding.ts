// Single source of truth for text encoding support lives in the monorepo's
// @usebruno/filestore package (packages/bruno-filestore/src/utils/encoding.ts)
// and is shared with the Electron app. Build tooling maps the `@bruno-encoding`
// alias to that file (see esbuild.extension.mjs, vitest.config.ts, tsconfig.json).
export * from '@bruno-encoding';
