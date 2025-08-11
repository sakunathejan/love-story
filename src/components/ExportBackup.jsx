import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { getAllMediaMeta, getMediaBlob } from '../storage'

export default function ExportBackup() {
  async function exportAll() {
    const zip = new JSZip()
    const metas = await getAllMediaMeta()
    const metaFolder = zip.folder('metadata')
    metaFolder.file('items.json', JSON.stringify(metas, null, 2))

    const mediaFolder = zip.folder('media')
    for (const m of metas) {
      const blob = await getMediaBlob(m.id)
      if (blob) mediaFolder.file(`${m.id}-${m.filename}`, blob)
    }

    const out = await zip.generateAsync({ type: 'blob' })
    saveAs(out, `love-story-backup-${new Date().toISOString().slice(0,10)}.zip`)
  }

  return (
    <div className="container-page py-6">
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between overflow-hidden w-full">
        <div>
          <h3 className="text-lg font-semibold">Export / Backup</h3>
          <p className="text-sm text-gray-500">Download all media and metadata as a ZIP. Placeholder for cloud sync.</p>
        </div>
        <button onClick={exportAll} className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700">Export ZIP</button>
      </div>
    </div>
  )
}
