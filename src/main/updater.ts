import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { existsSync, createWriteStream, unlinkSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export interface ReleaseAsset {
  id: number
  name: string
  size: number
  downloadUrl: string
  type: 'installer' | 'portable' | 'other'
}

export interface CheckUpdateResult {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string
  releaseTitle: string
  releaseNotes: string
  publishedAt: string
  releaseUrl: string
  installerAsset?: ReleaseAsset
  portableAsset?: ReleaseAsset
  allAssets: ReleaseAsset[]
  error?: string
}

const GITHUB_REPO = 'gpwid/oros'

export function compareSemVer(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  const p2 = v2.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] ?? 0
    const n2 = p2[i] ?? 0
    if (n1 > n2) return 1
    if (n1 < n2) return -1
  }
  return 0
}

export async function checkGitHubRelease(timeoutMs = 4000): Promise<CheckUpdateResult> {
  const currentVer = app.getVersion().replace(/^v/i, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      signal: controller.signal,
      headers: {
        'User-Agent': `Oros-Studio/${currentVer}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    clearTimeout(timer)

    if (!response.ok) {
      if (response.status === 404) {
        return {
          updateAvailable: false,
          currentVersion: currentVer,
          latestVersion: currentVer,
          releaseTitle: 'Initial Release',
          releaseNotes: 'No published releases found on GitHub repository.',
          publishedAt: new Date().toISOString(),
          releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
          allAssets: [],
          error: 'No releases available yet.'
        }
      }
      throw new Error(`GitHub returned HTTP ${response.status}`)
    }

    const data = await response.json()
    const rawTag = (data.tag_name || '').trim()
    const cleanTag = rawTag.replace(/^v/i, '')
    const isNewer = compareSemVer(cleanTag, currentVer) > 0

    const assets: ReleaseAsset[] = (data.assets || []).map((a: any) => {
      const lower = a.name.toLowerCase()
      let type: 'installer' | 'portable' | 'other' = 'other'
      if (lower.endsWith('.exe') && (lower.includes('setup') || lower.includes('install'))) {
        type = 'installer'
      } else if (lower.endsWith('.zip') || (lower.endsWith('.exe') && lower.includes('portable'))) {
        type = 'portable'
      } else if (lower.endsWith('.exe')) {
        type = 'installer'
      }

      return {
        id: a.id,
        name: a.name,
        size: a.size,
        downloadUrl: a.browser_download_url,
        type
      }
    })

    const installerAsset = assets.find((a) => a.type === 'installer') || assets.find((a) => a.name.toLowerCase().endsWith('.exe'))
    const portableAsset = assets.find((a) => a.type === 'portable') || assets.find((a) => a.name.toLowerCase().endsWith('.zip'))

    return {
      updateAvailable: isNewer,
      currentVersion: currentVer,
      latestVersion: cleanTag,
      releaseTitle: data.name || rawTag,
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
      releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      installerAsset,
      portableAsset,
      allAssets: assets
    }
  } catch (err: any) {
    clearTimeout(timer)
    return {
      updateAvailable: false,
      currentVersion: currentVer,
      latestVersion: currentVer,
      releaseTitle: '',
      releaseNotes: '',
      publishedAt: '',
      releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
      allAssets: [],
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Offline'
    }
  }
}

export async function downloadAssetToFile(
  downloadUrl: string,
  destinationPath: string,
  onProgress?: (progress: { percent: number; transferredBytes: number; totalBytes: number; transferredMb: number; totalMb: number }) => void
): Promise<boolean> {
  try {
    const res = await fetch(downloadUrl, {
      headers: {
        'User-Agent': `Oros-Studio/${app.getVersion()}`
      }
    })

    if (!res.ok || !res.body) {
      throw new Error(`Failed to download asset: HTTP ${res.status}`)
    }

    const totalBytes = parseInt(res.headers.get('content-length') || '0', 10)
    let transferredBytes = 0

    // Wrap web ReadableStream to node stream
    const reader = res.body.getReader()
    const nodeReadable = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read()
          if (done) {
            this.push(null)
          } else {
            transferredBytes += value.length
            if (onProgress && totalBytes > 0) {
              const percent = Math.min(100, (transferredBytes / totalBytes) * 100)
              onProgress({
                percent,
                transferredBytes,
                totalBytes,
                transferredMb: transferredBytes / (1024 * 1024),
                totalMb: totalBytes / (1024 * 1024)
              })
            }
            this.push(Buffer.from(value))
          }
        } catch (err) {
          this.destroy(err as Error)
        }
      }
    })

    const fileStream = createWriteStream(destinationPath)
    await pipeline(nodeReadable, fileStream)
    return true
  } catch (err) {
    console.error('Download error:', err)
    if (existsSync(destinationPath)) {
      try { unlinkSync(destinationPath) } catch {}
    }
    return false
  }
}

export function launchInstaller(installerPath: string): void {
  if (!existsSync(installerPath)) return
  try {
    spawn(installerPath, [], {
      detached: true,
      stdio: 'ignore'
    }).unref()
    app.quit()
  } catch (err) {
    console.error('Failed to spawn installer:', err)
    shell.openPath(installerPath)
  }
}
