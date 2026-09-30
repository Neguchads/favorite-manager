import { readFileSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';

// A loja do Edge só aceita de 1 a 4 números separados por ponto (sem "-beta")
const STORE_VERSION = /^\d+(\.\d+){0,3}$/;

/** Devolve o manifest (JSON em texto) com a versão do package.json. */
export function applyPackageVersion(manifestJson: string, version: string): string {
  if (!STORE_VERSION.test(version)) {
    throw new Error(`Versão "${version}" do package.json não é aceita no manifest (use só números, ex.: 1.2.0)`);
  }
  const manifest = JSON.parse(manifestJson);
  manifest.version = version;
  return JSON.stringify(manifest, null, 2) + '\n';
}

/**
 * Plugin do Vite: depois do build, grava em dist/manifest.json a versão do package.json.
 * Assim só existe um número de versão para manter.
 */
export function manifestVersionPlugin(packageJsonPath: string, distManifestPath: string): Plugin {
  return {
    name: 'manifest-version-from-package',
    apply: 'build',
    closeBundle() {
      const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      writeFileSync(distManifestPath, applyPackageVersion(readFileSync(distManifestPath, 'utf8'), version));
    },
  };
}
