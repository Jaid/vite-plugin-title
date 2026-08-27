import type {PackageJson} from 'type-fest'
import type {Plugin, ResolvedConfig} from 'vite'

import {join} from 'node:path'

import fs from 'fs-extra'

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
      const packageJsonFile = join(resolvedConfig.root, 'package.json')
      const packageJsonExists = await fs.pathExists(packageJsonFile)
      if (packageJsonExists) {
        const packageJson = await fs.readJson(packageJsonFile) as PackageJson
        if (packageJson.name) {
          resolvedTitle = (packageJson.displayName as string | undefined) || packageJson.name
        }
      }
    }
  }
  return plugin
}
