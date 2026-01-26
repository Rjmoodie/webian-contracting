#!/usr/bin/env node

/**
 * Script to copy .htaccess file to dist folder after build
 * This ensures the .htaccess file is included in the deployment package
 */

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');
const htaccessSource = join(process.cwd(), '.htaccess');
const htaccessDest = join(distDir, '.htaccess');

if (!existsSync(distDir)) {
  console.error('❌ dist folder does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!existsSync(htaccessSource)) {
  console.error('❌ .htaccess file not found in project root.');
  process.exit(1);
}

try {
  copyFileSync(htaccessSource, htaccessDest);
  console.log('✅ .htaccess file copied to dist folder');
} catch (error) {
  console.error('❌ Error copying .htaccess:', error.message);
  process.exit(1);
}
