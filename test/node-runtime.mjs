import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {build} from 'vite'

const rootFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-title-node-'))
const pluginSourceUrl = pathToFileURL(path.resolve('src/main.ts')).href

try {
  await Promise.all([
    fs.writeFile(path.join(rootFolder, 'index.html'), '<!doctype html><html><head></head><body><div id="app"></div></body></html>\n'),
    fs.writeFile(path.join(rootFolder, 'package.json'), `${JSON.stringify({
      name: 'node-runtime-fixture',
      displayName: 'Node Runtime Fixture',
      private: true,
      type: 'module',
    }, null, 2)}\n`),
    fs.writeFile(path.join(rootFolder, 'vite.config.ts'), [
      `import titlePlugin from ${JSON.stringify(pluginSourceUrl)}`,
      '',
      'export default {',
      '  plugins: [titlePlugin()],',
      '}',
      '',
    ].join('\n')),
  ])

  await build({
    root: rootFolder,
    logLevel: 'silent',
  })

  const html = await fs.readFile(path.join(rootFolder, 'dist/index.html'), 'utf8')
  assert.match(html, /<title>Node Runtime Fixture<\/title>/u)
} finally {
  await fs.rm(rootFolder, {
    recursive: true,
    force: true,
  })
}