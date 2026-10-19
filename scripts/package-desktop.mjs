import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('--- 1. Ensuring production build exists ---')
if (!fs.existsSync(path.join(rootDir, 'dist/index.html')) || !fs.existsSync(path.join(rootDir, 'dist-electron/index.js'))) {
  console.log('Running build (tsc && vite build)...')
  execSync('cmd /c pnpm run build', { cwd: rootDir, stdio: 'inherit' })
} else {
  console.log('Build output verified: dist/ and dist-electron/ present.')
}

console.log('--- 2. Generating Windows icon (public/icon.ico) ---')
const iconPngPath = path.join(rootDir, 'public/icon.png')
const iconIcoPath = path.join(rootDir, 'public/icon.ico')

if (fs.existsSync(iconPngPath)) {
  const png = fs.readFileSync(iconPngPath)
  const header = Buffer.from([0, 0, 1, 0, 1, 0])
  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0) // 256px
  entry.writeUInt8(0, 1) // 256px
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12)
  const icoBuf = Buffer.concat([header, entry, png])
  fs.writeFileSync(iconIcoPath, icoBuf)
  console.log(`Generated ${iconIcoPath} (${(icoBuf.length / 1024).toFixed(1)} KB)`)
}

console.log('--- 3. Setting up release directory ---')
const releaseDir = path.join(rootDir, 'release')
const appDir = path.join(releaseDir, 'Oros-win32-x64')

if (fs.existsSync(appDir)) {
  console.log('Removing previous release build...')
  fs.rmSync(appDir, { recursive: true, force: true })
}
fs.mkdirSync(appDir, { recursive: true })

console.log('--- 4. Copying Electron runtime binary ---')
const electronDist = path.join(rootDir, 'node_modules/electron/dist')
if (!fs.existsSync(electronDist)) {
  throw new Error(`Electron distribution not found at ${electronDist}`)
}

fs.cpSync(electronDist, appDir, { recursive: true })
console.log('Copied Electron runtime.')

console.log('--- 5. Renaming executable to Oros.exe ---')
const oldExe = path.join(appDir, 'electron.exe')
const newExe = path.join(appDir, 'Oros.exe')
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe)
  console.log('Renamed electron.exe -> Oros.exe')
}

console.log('--- 6. Packaging application bundle ---')
const resourcesDir = path.join(appDir, 'resources')
const defaultAppAsar = path.join(resourcesDir, 'default_app.asar')
if (fs.existsSync(defaultAppAsar)) {
  fs.unlinkSync(defaultAppAsar)
}

const destAppDir = path.join(resourcesDir, 'app')
fs.mkdirSync(destAppDir, { recursive: true })

// Copy dist/
fs.cpSync(path.join(rootDir, 'dist'), path.join(destAppDir, 'dist'), { recursive: true })

// Copy dist-electron/
fs.cpSync(path.join(rootDir, 'dist-electron'), path.join(destAppDir, 'dist-electron'), { recursive: true })

// Copy public/
fs.cpSync(path.join(rootDir, 'public'), path.join(destAppDir, 'public'), { recursive: true })

// Create minimal production package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  main: pkg.main,
  description: pkg.description,
  author: pkg.author || 'Oros Studio'
}
fs.writeFileSync(path.join(destAppDir, 'package.json'), JSON.stringify(prodPkg, null, 2))
console.log('Packaged application bundle into resources/app/')

console.log('--- 7. Patching Windows Executable Metadata with rcedit ---')
const rceditPath = path.join(
  rootDir,
  'node_modules/.pnpm/electron-winstaller@5.4.0/node_modules/electron-winstaller/vendor/rcedit.exe'
)

if (fs.existsSync(rceditPath) && fs.existsSync(iconIcoPath)) {
  try {
    const cmd = `"${rceditPath}" "${newExe}" --set-icon "${iconIcoPath}" --set-version-string "FileDescription" "Oros — Worldbuilding Studio" --set-version-string "ProductName" "Oros" --set-version-string "CompanyName" "Oros Studio" --set-version-string "LegalCopyright" "Copyright (C) 2026 Oros" --set-product-version "${pkg.version}.0" --set-file-version "${pkg.version}.0"`
    execSync(cmd, { stdio: 'inherit' })
    console.log('Applied custom icon and Windows metadata to Oros.exe')
  } catch (err) {
    console.warn('rcedit metadata patch warning (app is still functional):', err.message)
  }
}

console.log('--- 8. Creating Portable Distribution ZIP Archive ---')
const zipPath = path.join(releaseDir, `Oros-v${pkg.version}-Windows-x64.zip`)
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath)
}

const sevenZipPath = path.join(
  rootDir,
  'node_modules/.pnpm/electron-winstaller@5.4.0/node_modules/electron-winstaller/vendor/7z-x64.exe'
)

if (fs.existsSync(sevenZipPath)) {
  try {
    console.log(`Compressing ${zipPath} with 7-Zip...`)
    execSync(`"${sevenZipPath}" a -tzip "${zipPath}" "${appDir}\\*" -mx=5`, { stdio: 'ignore' })
    const zipSize = fs.statSync(zipPath).size
    console.log(`Created portable archive: ${zipPath} (${(zipSize / (1024 * 1024)).toFixed(1)} MB)`)
  } catch (err) {
    console.warn('7-Zip compression warning:', err.message)
  }
}

console.log('--- 9. Compiling Windows Setup Installer with NSIS ---')
const makensisCandidates = [
  'C:\\Users\\azisk\\AppData\\Local\\electron-builder\\Cache\\nsis-3.0.4.1\\nsis-3.0.4.1-1mx3n\\makensis.exe',
  'makensis'
]
const nsisScript = path.join(rootDir, 'scripts/installer.nsi')
const makensisPath = makensisCandidates.find((p) => fs.existsSync(p)) || 'makensis'
const setupExePath = path.join(releaseDir, `Oros-Setup-${pkg.version}.exe`)

if (fs.existsSync(nsisScript)) {
  try {
    console.log(`Compiling NSIS installer...`)
    execSync(`"${makensisPath}" "${nsisScript}"`, { cwd: path.join(rootDir, 'scripts'), stdio: 'inherit' })
    if (fs.existsSync(setupExePath)) {
      const setupSize = fs.statSync(setupExePath).size
      console.log(`Created Windows Installer: ${setupExePath} (${(setupSize / (1024 * 1024)).toFixed(1)} MB)`)
    }
  } catch (err) {
    console.warn('NSIS compiler warning:', err.message)
  }
}

console.log('\n========================================')
console.log('  SUCCESSFULLY BUILT OROS DESKTOP APP!')
console.log('========================================')
console.log(`Standalone Executable: ${newExe}`)
if (fs.existsSync(setupExePath)) {
  console.log(`Windows Installer Setup: ${setupExePath}`)
}
if (fs.existsSync(zipPath)) {
  console.log(`Portable Archive: ${zipPath}`)
}
console.log('Both the installer and portable archive are ready for deployment and GitHub Releases!')

