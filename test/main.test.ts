import {afterEach, expect, test} from 'bun:test'
import os from 'node:os'

import fs from 'fs-extra'
import {build} from 'vite'

const pluginSourceUrl = new URL('../src/main.ts', import.meta.url)
const temporaryFolders = new Set<string>

type FixtureProjectOptions = {
  title?: string
}

const extractTitle = (html: string) => {
  const titleMatch = /<title>(?<title>.*?)<\/title>/u.exec(html)
  if (titleMatch?.groups?.title) {
    return titleMatch.groups.title
  }
  throw new Error(`Expected built HTML to contain a <title> tag.\n\n${html}`)
}
const buildFixtureProject = async ({title}: FixtureProjectOptions = {}) => {
  const rootFolder = await fs.mkdtemp(`${os.tmpdir().replaceAll('\\', '/')}/vite-plugin-title-`)
  temporaryFolders.add(rootFolder)
  const pluginCall = title === undefined ? 'titlePlugin()' : `titlePlugin(${JSON.stringify(title)})`
  await Promise.all([
    fs.writeFile(`${rootFolder}/index.html`, [
      '<!doctype html>',
      '<html>',
      '  <head></head>',
      '  <body>',
      '    <div id="app"></div>',
      '    <script type="module" src="./main.ts"></script>',
      '  </body>',
      '</html>',
      '',
    ].join('\n')),
    fs.writeFile(`${rootFolder}/main.ts`, 'document.querySelector(\'#app\')?.setAttribute(\'data-built\', \'true\')\n'),
    fs.writeFile(`${rootFolder}/package.json`, `${JSON.stringify({
      name: 'fixture-project',
      displayName: 'Fixture Project',
      private: true,
      type: 'module',
    }, null, 2)}\n`),
    fs.writeFile(`${rootFolder}/vite.config.ts`, [
      `import titlePlugin from ${JSON.stringify(pluginSourceUrl.href)}`,
      '',
      'export default {',
      `  plugins: [${pluginCall}],`,
      '}',
      '',
    ].join('\n')),
  ])
  await build({
    root: rootFolder,
    logLevel: 'silent',
  })
  const [indexHtml, assetFiles] = await Promise.all([
    fs.readFile(`${rootFolder}/dist/index.html`, 'utf8'),
    fs.readdir(`${rootFolder}/dist/assets`),
  ])
  return {
    assetFiles,
    title: extractTitle(indexHtml),
  }
}
afterEach(async () => {
  await Promise.all([...temporaryFolders].map(async folder => fs.rm(folder, {
    recursive: true,
    force: true,
  })))
  temporaryFolders.clear()
})
test('builds a project using the package display name', async () => {
  const result = await buildFixtureProject()
  expect(result.title).toBe('Fixture Project')
  expect(result.assetFiles.some(file => file.endsWith('.js'))).toBe(true)
}, 30_000)
test('builds a project using an explicit title', async () => {
  const result = await buildFixtureProject({
    title: 'Custom Fixture Title',
  })
  expect(result.title).toBe('Custom Fixture Title')
  expect(result.assetFiles.some(file => file.endsWith('.js'))).toBe(true)
}, 30_000)
