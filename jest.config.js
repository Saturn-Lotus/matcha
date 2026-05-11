import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const baseConfig = {
  testEnvironment: 'node',
}

async function jestConfig() {
  const nextConfig = await createJestConfig(baseConfig)()
  return {
    ...nextConfig,
    transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  }
}

export default jestConfig
