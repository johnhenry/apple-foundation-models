import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      format: 'esm',
      file: 'dist/index.mjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      format: 'cjs',
      file: 'dist/index.cjs',
      sourcemap: true,
      exports: 'named',
    },
  ],
  external: ['child_process', 'fs', 'path', 'util'],
  platform: 'node',
});
