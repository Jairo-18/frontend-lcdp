import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, '../dist/frontend-lcdp/server');

const serverMjsPath = resolve(serverDir, 'server.mjs');
let serverContent = readFileSync(serverMjsPath, 'utf-8');

if (serverContent.includes('angular-app-engine-manifest')) {
  console.log('Manifest imports already present, skipping.');
  process.exit(0);
}

const chunkFiles = readdirSync(serverDir).filter(f => f.startsWith('chunk-') && f.endsWith('.mjs'));

let ssrChunkFile = null;
for (const file of chunkFiles) {
  const content = readFileSync(resolve(serverDir, file), 'utf-8');
  if (content.includes('Angular app engine manifest is not set')) {
    ssrChunkFile = file;
    break;
  }
}

if (!ssrChunkFile) {
  console.error('Could not find SSR chunk with manifest error');
  process.exit(1);
}

console.log(`Found SSR chunk: ${ssrChunkFile}`);

const chunkPath = resolve(serverDir, ssrChunkFile);
let chunkContent = readFileSync(chunkPath, 'utf-8');

const isMinified = !chunkContent.includes('var angularAppEngineManifest;');

if (isMinified) {
  // --- MINIFIED (production) ---
  const engineVarMatch = chunkContent.match(/var (\w+);function \w+\(\)\{if\(!\1\)throw new Error\("Angular app engine manifest is not set/);
  if (!engineVarMatch) {
    console.error('Could not find engine manifest variable in minified code');
    process.exit(1);
  }
  const engineVar = engineVarMatch[1];
  const appSetterMatch = chunkContent.match(/function (\w+)\(\w+\)\{\w+=\w+\}function \w+\(\)\{if\(!\w+\)throw new Error\("Angular app manifest is not set/);
  const appSetterName = appSetterMatch ? appSetterMatch[1] : null;

  chunkContent = chunkContent.replace(
    `var ${engineVar};`,
    `var ${engineVar};function __setEM(t){${engineVar}=t}`
  );

  const exportExtra = appSetterName
    ? `,__setEM,${appSetterName} as __setAM`
    : `,__setEM`;
  chunkContent = chunkContent.replace(/export\{([^}]+)\}/, `export{$1${exportExtra}}`);
  writeFileSync(chunkPath, chunkContent, 'utf-8');

  // Patch server.mjs import
  const escapedChunk = ssrChunkFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const importRegex = new RegExp(`(import\\{[^}]+\\}from"\\.\\/${escapedChunk}")`);
  const importMatch = serverContent.match(importRegex);
  if (!importMatch) { console.error('Could not find chunk import (minified)'); process.exit(1); }

  const setterImports = appSetterName ? ',__setEM,__setAM' : ',__setEM';
  const newImport = importMatch[1].replace('}from', `${setterImports}}from`);
  serverContent = serverContent.replace(importMatch[1], newImport);

  serverContent = serverContent.replace(
    "import './polyfills.server.mjs';",
    "import './polyfills.server.mjs';\nimport __emd from './angular-app-engine-manifest.mjs';\nimport __amd from './angular-app-manifest.mjs';"
  );

  serverContent = serverContent.replace(
    newImport,
    newImport + (appSetterName
      ? '\n__setEM(__emd);__setAM(__amd);'
      : '\n__setEM(__emd);')
  );
} else {
  // --- READABLE (development) ---
  chunkContent = chunkContent.replace(
    'var angularAppEngineManifest;',
    'var angularAppEngineManifest;\nfunction setAngularAppEngineManifest(v) { angularAppEngineManifest = v; }'
  );

  // Check if setAngularAppManifest is already exported
  const appSetterAlreadyExported = /export\s*\{[^}]*setAngularAppManifest[^}]*\}/s.test(chunkContent);

  // Add only the engine setter to exports
  chunkContent = chunkContent.replace(
    /export\s*\{([^}]*)\}/s,
    `export {$1,\n  setAngularAppEngineManifest}`
  );

  writeFileSync(chunkPath, chunkContent, 'utf-8');

  // Patch server.mjs - find multi-line import
  const escapedChunk = ssrChunkFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const importRegex = new RegExp(`(import\\s*\\{[^}]*\\}\\s*from\\s*"\\.\\/${escapedChunk}")`, 's');
  const importMatch = serverContent.match(importRegex);
  if (!importMatch) { console.error('Could not find chunk import (readable)'); process.exit(1); }

  const setterImports = appSetterAlreadyExported
    ? `,\n  setAngularAppEngineManifest,\n  setAngularAppManifest`
    : `,\n  setAngularAppEngineManifest`;
  const newImport = importMatch[1].replace(/\}\s*from/s, `${setterImports}\n} from`);
  serverContent = serverContent.replace(importMatch[1], newImport);

  // Add manifest file imports
  serverContent = serverContent.replace(
    /import\s+['"]\.\/polyfills\.server\.mjs['"];?\s*/,
    `import './polyfills.server.mjs';\nimport __emd from './angular-app-engine-manifest.mjs';\nimport __amd from './angular-app-manifest.mjs';\n`
  );

  // Find position after all imports to insert setter calls
  const allImportsRegex = /(?:^|\n)(import\s+(?:\{[^}]*\}\s*from\s*"[^"]*"|'[^']*'|"[^"]*"|[^\n]*from\s*"[^"]*");?\s*)/gs;
  let lastMatchEnd = 0;
  let m;
  while ((m = allImportsRegex.exec(serverContent)) !== null) {
    lastMatchEnd = m.index + m[0].length;
  }

  if (lastMatchEnd > 0) {
    const calls = appSetterAlreadyExported
      ? '\nsetAngularAppEngineManifest(__emd);\nsetAngularAppManifest(__amd);\n'
      : '\nsetAngularAppEngineManifest(__emd);\n';
    serverContent = serverContent.slice(0, lastMatchEnd) + calls + serverContent.slice(lastMatchEnd);
  }
}

writeFileSync(serverMjsPath, serverContent, 'utf-8');
console.log('Patched server.mjs: added manifest imports and initialization');
