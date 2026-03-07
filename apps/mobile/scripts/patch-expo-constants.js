#!/usr/bin/env node
/**
 * Patches expo-constants android/build.gradle to use ExpoModulesCorePlugin
 * instead of expo-module-gradle-plugin (SDK 51 compatibility when 55.x gets installed)
 */
const fs = require('fs');
const path = require('path');

function findExpoConstants(dir) {
  const nodeModules = path.join(dir, 'node_modules', 'expo-constants');
  if (fs.existsSync(nodeModules)) return nodeModules;
  const parent = path.dirname(dir);
  if (parent !== dir) return findExpoConstants(parent);
  return null;
}

const expoConstantsPath = findExpoConstants(__dirname) || findExpoConstants(process.cwd());
if (!expoConstantsPath) {
  console.log('patch-expo-constants: expo-constants not found, skipping');
  process.exit(0);
}

const buildGradlePath = path.join(expoConstantsPath, 'android', 'build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.log('patch-expo-constants: build.gradle not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');
if (!content.includes('expo-module-gradle-plugin')) {
  console.log('patch-expo-constants: already compatible, skipping');
  process.exit(0);
}

// Extract version from original file
const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
const version = versionMatch ? versionMatch[1] : '16.0.2';

// SDK 51 compatible build.gradle (uses ExpoModulesCorePlugin instead of expo-module-gradle-plugin)
const patchedContent = `apply plugin: 'com.android.library'

group = 'host.exp.exponent'
version = '${version}'

apply from: "../scripts/get-app-config-android.gradle"

def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
apply from: expoModulesCorePlugin
applyKotlinExpoModulesCorePlugin()
useCoreDependencies()
useDefaultAndroidSdkVersions()
useExpoPublishing()

android {
  namespace "expo.modules.constants"
  defaultConfig {
    versionCode 33
    versionName "${version}"
  }
}

dependencies {
  api "androidx.annotation:annotation:1.0.0"
  implementation "commons-io:commons-io:2.6"
}
`;

fs.writeFileSync(buildGradlePath, patchedContent);
console.log('patch-expo-constants: patched expo-constants for SDK 51 compatibility');
