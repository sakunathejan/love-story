import { useEffect, useState } from 'react'
import { addMessage, listMessages, deleteMessage, addReply, addReaction } from '../storage'

export default function Messages() {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const [replyForId, setReplyForId] = useState(null)
  const [replyName, setReplyName] = useState('')
  const [replyText, setReplyText] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const MAX_LENGTH = 500

  useEffect(() => {
    ;(async () => setItems(await listMessages()))()
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    const msg = await addMessage({ name, text })
    setItems((prev) => [msg, ...prev])
    setText('')
    setPage(1)
  }

  async function removeMessage(id) {
    await deleteMessage(id)
    setItems((prev) => {
      const next = prev.filter((m) => m.id !== id)
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      setPage((p) => Math.min(p, nextTotalPages))
      return next
    })
  }

  function replyTo(id) {
    setReplyForId(id)
    setReplyName('')
    setReplyText('')
  }

  async function submitReply(e) {
    e?.preventDefault?.()
    if (!replyForId || !replyText.trim()) return
    const reply = await addReply(replyForId, { name: replyName, text: replyText })
    setItems((prev) => prev.map((m) => (m.id === replyForId ? { ...m, replies: [reply, ...(m.replies || [])] } : m)))
    setReplyForId(null)
    setReplyName('')
    setReplyText('')
  }

  async function reactTo(id, emoji) {
    const result = await addReaction(id, emoji)
    if (!result) return
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, reactions: result.reactions } : m)))
  }

  return (
    <div className="container-page py-6 grid gap-6 md:grid-cols-2 items-start">
      <form onSubmit={submit} className="w-full max-w-xl mx-auto md:mx-0 self-start space-y-3 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Leave a message</h3>
          <p className="text-xs text-gray-500">Share your thoughts. Max {MAX_LENGTH} characters.</p>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900" />
        <textarea
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 h-36 sm:h-40 resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{text.length}/{MAX_LENGTH}</span>
          <button className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50" disabled={!text.trim()}>
            Send
          </button>
        </div>
      </form>
      <div className="space-y-3 min-w-0">
        {items.slice((page - 1) * pageSize, page * pageSize).map((m) => (
          <div key={m.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-500 truncate">{new Date(m.at).toLocaleString()} • {m.name || 'Guest'}</div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => replyTo(m.id)}>Reply</button>
                <div className="flex items-center gap-1">
                  {["👍","❤️","😂","🎉"].map((e) => (
                    <button key={e} className="text-base" onClick={() => reactTo(m.id, e)} title="React">
                      {e}
                      {m.reactions?.[e] ? <span className="ml-1 text-xs text-gray-500">{m.reactions[e]}</span> : null}
                    </button>
                  ))}
                </div>
                <button className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeMessage(m.id)}>Delete</button>
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap break-words">{m.text}</div>

            {replyForId === m.id && (
              <form onSubmit={submitReply} className="mt-3 space-y-2 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/40 backdrop-blur">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={replyName}
                    onChange={(e) => setReplyName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900"
                  />
                  <div className="sm:col-span-2">
                    <textarea
                      value={replyText}
                      maxLength={MAX_LENGTH}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply…"
                      className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 h-28 resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">{replyText.length}/{MAX_LENGTH}</span>
                  <div className="flex items-center gap-2">
                    <button type="submit" className="px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700" disabled={!replyText.trim()}>Reply</button>
                    <button type="button" onClick={() => { setReplyForId(null); setReplyText(''); }} className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                  </div>
                </div>
              </form>
            )}
            {m.replies?.length ? (
              <div className="mt-3 space-y-2">
                {m.replies.map((r) => (
                  <div key={r.id} className="pl-3 border-l-2 border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500">{new Date(r.at).toLocaleString()} • {r.name || 'Guest'}</div>
                    <div className="mt-0.5 whitespace-pre-wrap break-words">{r.text}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {/* Pagination controls */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            className="px-3 py-1.5 rounded border disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="text-sm">
            Page {page} / {Math.max(1, Math.ceil(items.length / pageSize))}
          </div>
          <button
            className="px-3 py-1.5 rounded border disabled:opacity-50"
            disabled={page >= Math.max(1, Math.ceil(items.length / pageSize))}
            onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(items.length / pageSize)), p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
