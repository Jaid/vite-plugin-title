import {expect, test} from 'bun:test'

const {default: vitePluginTitle} = await import('#src/main.ts')

test('should run', () => {
  const result = vitePluginTitle()
  expect(result).toBe('vite-plugin-title') // TODO Test actual functionality
})
