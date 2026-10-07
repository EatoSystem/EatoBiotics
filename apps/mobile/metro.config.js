const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [
  path.join(workspaceRoot, "packages/vocabulary"),
  path.join(workspaceRoot, "packages/contracts"),
]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

config.resolver.extraNodeModules = {
  "@eatobiotics/vocabulary": path.join(workspaceRoot, "packages/vocabulary"),
  "@eatobiotics/contracts": path.join(workspaceRoot, "packages/contracts"),
}

module.exports = config
