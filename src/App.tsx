import { useEffect, useRef, useState } from 'react'
import { isHardMode, slotIndex, validateSave, withHardMode } from './save.ts'

type LoadedSave = { name: string; bytes: Uint8Array }

export default function App() {
  const [save, setSave] = useState<LoadedSave | null>(null)
  const [hard, setHard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Stop the browser from navigating to a file dropped outside the drop zone.
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  async function loadFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const problem = validateSave(bytes)
    if (problem) {
      setError(problem)
      setSave(null)
      return
    }
    setError(null)
    setSave({ name: file.name, bytes })
    setHard(isHardMode(bytes))
  }

  function download() {
    if (!save) return
    const blob = new Blob([withHardMode(save.bytes, hard)], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = save.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const original = save ? isHardMode(save.bytes) : false
  const changed = save !== null && hard !== original

  return (
    <main>
      <header>
        <h1>Dream Team Hard Mode Toggle</h1>
        <p className="lede">
          Turn Hard Mode on or off for an existing <em>Mario &amp; Luigi: Dream Team</em> save,
          which the game normally only lets you pick when creating a file.
        </p>
      </header>

      {!save && (
        <label
          className={`dropzone${dragging ? ' dragging' : ''}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) void loadFile(file)
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".sav"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void loadFile(file)
              e.target.value = ''
            }}
          />
          <span className="dropzone-title">Drop your save file here</span>
          <span className="dropzone-hint">
            or click to choose <code>ML4_001.sav</code> / <code>ML4_002.sav</code>
          </span>
        </label>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {save && (
        <section className="card" aria-label="Loaded save">
          <div className="file-row">
            <div>
              <div className="file-name">{save.name}</div>
              <div className="file-meta">
                Slot {slotIndex(save.bytes)} · currently {original ? 'Hard Mode' : 'Normal'}
              </div>
            </div>
            <button type="button" className="link" onClick={() => setSave(null)}>
              Load a different file
            </button>
          </div>

          <label className="switch-row">
            <span>
              <span className="switch-label">Hard Mode</span>
              <span className="switch-state">{hard ? 'On' : 'Off'}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={hard}
              onChange={(e) => setHard(e.target.checked)}
            />
          </label>

          {hard && !original && (
            <p className="note">
              Hard Mode caps items at 10 of each. A stack above 10 drops to 10 the next time it
              changes.
            </p>
          )}

          <button type="button" className="primary" disabled={!changed} onClick={download}>
            Download {save.name}
          </button>
          {!changed && <p className="hint">Flip the switch to make a change first.</p>}
        </section>
      )}

      <section className="help">
        <h2>Where's my save?</h2>
        <ul>
          <li>
            <strong>Azahar / Citra:</strong> right-click the game › <em>Open Save Data Location</em>.{' '}
            <code>ML4_001.sav</code> is the first file, <code>ML4_002.sav</code> the second.
          </li>
          <li>
            <strong>3DS:</strong> export the save with Checkpoint or JKSV, edit it here, then
            restore it.
          </li>
        </ul>
        <p>
          Close the game before replacing the file, and keep a copy of the original. Tested with
          the North American release.
        </p>
      </section>
    </main>
  )
}
