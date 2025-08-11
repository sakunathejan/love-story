import { useEffect, useState } from 'react'
import { getSettings, setSettings } from '../storage'

export default function Settings({ theme, setTheme }) {
  const [uploadLimit, setUploadLimit] = useState(100)
  const [password, setPassword] = useState('')

  useEffect(() => {
    ;(async () => {
      const s = await getSettings()
      setTheme(s.theme)
      setUploadLimit(s.uploadLimit)
      setPassword(s.privacy?.password || '')
    })()
  }, [])

  async function save() {
    await setSettings({ theme, uploadLimit, privacy: { password } })
    alert('Settings saved')
  }

  return (
    <div className="container-page py-6 space-y-6">
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm">Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
        <h3 className="text-lg font-semibold">Uploads</h3>
        <label className="block text-sm">Upload limit per batch</label>
        <input type="number" value={uploadLimit} onChange={(e) => setUploadLimit(Number(e.target.value || 0))} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
        <h3 className="text-lg font-semibold">Privacy</h3>
        <label className="block text-sm">Optional password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-3 py-2 rounded border bg-white dark:bg-gray-900" />
        <p className="text-xs text-gray-500">Note: This is a client-side placeholder and not secure protection.</p>
      </div>

      <button onClick={save} className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700">Save Settings</button>
    </div>
  )
}
