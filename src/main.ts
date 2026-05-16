import type {PackageJson} from 'type-fest'
import type {Plugin, ResolvedConfig} from 'vite'

import fs from 'fs/promises' // eslint-disable-line
import path from 'path'

export default function titlePlugin(title?: string) {
  let resolvedTitle = title
  const plugin: Plugin = {
    name: 'title',
    transformIndexHtml() {
      if (!resolvedTitle) {
        return
      }
      return [
        {
          tag: 'title',
          children: resolvedTitle,
          injectTo: 'head-prepend',
        },
      ]
    },
  }
  if (!resolvedTitle) {
    plugin.configResolved = async (resolvedConfig: ResolvedConfig) => {
      const packageJsonFile = path.join(resolvedConfig.root, 'package.json')
      const packageJsonFileExists = await fs.exists(packageJsonFile)
      if (packageJsonFileExists) {
        const packageJsonString = await fs.readFile(packageJsonFile, 'utf8')
        const packageJson = JSON.parse(packageJsonString) as PackageJson
        if (packageJson.name) {
          resolvedTitle = (packageJson.displayName as string | undefined) || packageJson.name
        }
      }
    }
  }
  return plugin
}
