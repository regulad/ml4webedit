import { useEffect, useRef, useState } from 'react'
import { isHardMode, slotIndex, validateSave, withHardMode } from './save.ts'

type LoadedSave = { name: string; bytes: Uint8Array }

// GitHub mark, from primer/octicons icons/mark-github-16.svg (MIT).
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"
      />
    </svg>
  )
}

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

      <footer className="site-footer">
        Made by{' '}
        <a href="https://github.com/regulad" target="_blank" rel="noreferrer">
          <GitHubMark />
          regulad
        </a>{' '}
        with Claude Opus 5.5
      </footer>
    </main>
  )
}
