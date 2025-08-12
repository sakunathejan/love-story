import { useEffect, useState } from 'react'
import MediaCard from './MediaCard'
import { getAllMediaMeta, toggleFavorite, deleteMedia, addComment } from '../storage'

export default function Favorites() {
  const [items, setItems] = useState([])

  useEffect(() => {
    ;(async () => {
      const metas = await getAllMediaMeta()
      setItems(metas.filter((m) => m.favorite))
    })()
  }, [])

  async function handleToggleFavorite(meta) {
    const next = await toggleFavorite(meta.id)
    setItems((prev) => prev.filter((m) => (m.id === next.id ? next.favorite : m.favorite)))
  }

  async function handleDelete(meta) {
    await deleteMedia(meta.id)
    setItems((prev) => prev.filter((m) => m.id !== meta.id))
  }

  async function handleComment(meta) {
    const text = prompt('Write a comment:')
    if (!text) return
    await addComment(meta.id, text)
  }

  return (
    <div className="container-page py-6 space-y-6">
      {items.length === 0 ? (
        <div className="text-center text-gray-500">No favorites yet.</div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {items.map((m) => (
            <MediaCard key={m.id} meta={m} onToggleFavorite={handleToggleFavorite} onOpen={() => {}} onDelete={handleDelete} onComment={handleComment} />
          ))}
        </div>
      )}
    </div>
  )
}
