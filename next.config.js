/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mark server-only packages as external
  serverComponentsExternalPackages: ['pg', 'pg-native'],
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      // pg is a Node.js-only package, exclude it from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        'pg-native': false,
      }
      
      // Handle optional packages that may not be installed
      const fs = require('fs')
      const path = require('path')
      
      // Check if packages exist, if not use stubs
      const checkAndAlias = (packageName, stubPath) => {
        const packagePath = path.join(process.cwd(), 'node_modules', packageName)
        if (!fs.existsSync(packagePath)) {
          return { [packageName]: stubPath }
        }
        return {}
      }
      
      // Only alias if package doesn't exist (don't interfere with installed packages)
      const xlsxPath = path.join(process.cwd(), 'node_modules', 'xlsx')
      const papaparsePath = path.join(process.cwd(), 'node_modules', 'papaparse')
      
      const alias = {}
      if (!fs.existsSync(papaparsePath)) {
        alias['papaparse'] = path.resolve(__dirname, 'lib/stubs/papaparse-stub.js')
      }
      if (!fs.existsSync(xlsxPath)) {
        alias['xlsx'] = path.resolve(__dirname, 'lib/stubs/xlsx-stub.js')
      }
      
      // Only add aliases if packages don't exist - let webpack resolve normally if they do
      if (Object.keys(alias).length > 0) {
        config.resolve.alias = {
          ...config.resolve.alias,
          ...alias,
        }
      }
    } else {
      // On server side, mark pg as external to prevent bundling issues
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('pg', 'pg-native')
      }
    }
    
    return config
  },
}

module.exports = nextConfig

