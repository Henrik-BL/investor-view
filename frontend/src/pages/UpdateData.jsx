import { useEffect, useRef, useState } from 'react'
import '../styles/UpdateData.css'

function UpdateData() {
  const updateStreamEndpoints = ['/api/screener/update_data', '/api/update_data']
  const abortControllerRef = useRef(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('Ready to run the backend update stream.')
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    ticker: '',
    lastError: ''
  })

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const closeStream = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }

  const getNextEventBoundary = (buffer) => {
    const actualBoundaryIndex = buffer.indexOf('\n\n')
    const escapedBoundaryIndex = buffer.indexOf('\\n\\n')

    if (actualBoundaryIndex === -1) {
      return escapedBoundaryIndex
    }

    if (escapedBoundaryIndex === -1) {
      return actualBoundaryIndex
    }

    return Math.min(actualBoundaryIndex, escapedBoundaryIndex)
  }

  const getBoundaryLength = (buffer, boundaryIndex) => {
    return buffer.startsWith('\\n\\n', boundaryIndex) ? 4 : 2
  }

  const processEventChunk = (rawEvent) => {
    const normalizedEvent = rawEvent.replace(/\\n/g, '\n').trim()

    if (!normalizedEvent) {
      return
    }

    const dataLines = normalizedEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())

    if (dataLines.length === 0) {
      return
    }

    try {
      const payload = JSON.parse(dataLines.join('\n'))

      if (payload.status === 'started') {
        setStatus('running')
        setMessage(`Update started for ${payload.total ?? 0} tickers.`)
        setProgress((currentProgress) => ({
          ...currentProgress,
          total: payload.total ?? 0,
          percent: 0,
          ticker: '',
          lastError: ''
        }))
        return
      }

      if (payload.status === 'progress' || payload.status === 'error') {
        setStatus(payload.status === 'error' ? 'error' : 'running')
        setMessage(
          payload.status === 'error'
            ? `Failed on ${payload.ticker}: ${payload.error}`
            : `Processing ${payload.ticker} (${payload.current}/${payload.total}).`
        )
        setProgress({
          current: payload.current ?? 0,
          total: payload.total ?? 0,
          percent: payload.percent ?? 0,
          ticker: payload.ticker ?? '',
          lastError: payload.status === 'error' ? payload.error ?? 'Unknown error.' : ''
        })
        return
      }

      if (payload.status === 'complete') {
        setStatus('complete')
        setMessage(payload.message || 'Update complete.')
        setProgress((currentProgress) => ({
          ...currentProgress,
          percent: 100
        }))
        setIsUpdating(false)
        closeStream()
      }
    } catch (error) {
      console.error('Failed to parse update stream payload:', rawEvent, error)
      setStatus('error')
      setMessage('Received an invalid update payload from the server.')
      setIsUpdating(false)
      closeStream()
    }
  }

  const connectToStream = async (endpointIndex = 0) => {
    const endpoint = updateStreamEndpoints[endpointIndex]

    if (!endpoint) {
      console.error('Update stream connection failed for all known endpoints.')
      setStatus('error')
      setMessage('Could not connect to the update stream. Check the backend route and browser network tab.')
      setIsUpdating(false)
      closeStream()
      return
    }

    console.log(`Connecting to update stream at ${endpoint}...`)
    setMessage(`Connecting to update stream at ${endpoint}...`)
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream'
        },
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Readable stream not available in this browser.')
      }

      console.log(`Update stream connected: ${endpoint}`)
      setStatus('running')
      setMessage(`Connected to update stream at ${endpoint}. Waiting for events...`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        let boundaryIndex = getNextEventBoundary(buffer)

        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex)
          const boundaryLength = getBoundaryLength(buffer, boundaryIndex)

          buffer = buffer.slice(boundaryIndex + boundaryLength)
          processEventChunk(rawEvent)
          boundaryIndex = getNextEventBoundary(buffer)
        }
      }

      const trailingEvent = buffer.trim()
      if (trailingEvent) {
        processEventChunk(trailingEvent)
      }

      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return
      }

      console.error(`Update stream connection failed at ${endpoint}:`, error)

      if (endpointIndex < updateStreamEndpoints.length - 1) {
        connectToStream(endpointIndex + 1)
        return
      }

      setStatus('error')
      setMessage('Update stream disconnected before completion.')
      setIsUpdating(false)
      closeStream()
    }
  }

  const handleStartUpdate = () => {
    if (isUpdating) {
      return
    }

    closeStream()
    setIsUpdating(true)
    setStatus('starting')
    setMessage('Connecting to update stream...')
    setProgress({
      current: 0,
      total: 0,
      percent: 0,
      ticker: '',
      lastError: ''
    })

    connectToStream()
  }

  return (
    <div className="update-data-page">
      <div className="update-data-card">
        <h1>Update Data</h1>
        <p>{message}</p>
        <button
          type="button"
          className="update-data-btn"
          onClick={handleStartUpdate}
          disabled={isUpdating}
          aria-busy={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Start Update Stream'}
        </button>

        {(status !== 'idle' || progress.total > 0) && (
          <div className="update-progress-panel">
            <div className="update-progress-header">
              <span>{status === 'complete' ? 'Complete' : 'Update Progress'}</span>
              <span>{progress.percent.toFixed(2)}%</span>
            </div>
            <div className="update-progress-track" aria-hidden="true">
              <div
                className="update-progress-fill"
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
              />
            </div>
            <div className="update-progress-meta">
              <span>{progress.current} / {progress.total || 0}</span>
              <span>{status}</span>
            </div>
            {progress.ticker && (
              <p className="update-current-ticker">Current ticker: {progress.ticker}</p>
            )}
            {progress.lastError && (
              <p className="update-last-error">Last error: {progress.lastError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UpdateData
