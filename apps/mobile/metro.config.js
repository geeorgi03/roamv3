const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch the specific workspace packages instead of the entire monorepo root.
// Watching monorepoRoot directly causes "Failed to start watch mode" on Windows
// because the OS file-watcher limit is exceeded by node_modules + .git + etc.
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages', 'db'),
  path.resolve(monorepoRoot, 'packages', 'types'),
  path.resolve(monorepoRoot, 'packages', 'shared-types'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.blockList = [
  /.*\.git\/.*/,
  /.*node_modules\/.*\/node_modules\/react-native\/.*/,
];

module.exports = config;
