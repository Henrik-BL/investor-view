import { useEffect } from 'react'
import '../styles/InfoBox.css'

function InfoBox({ message, variant = 'info', isVisible, onClose, duration = 5000 }) {
  useEffect(() => {
    if (!isVisible || !message || typeof onClose !== 'function') {
      return undefined
    }

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, isVisible, message, onClose])

  if (!isVisible || !message) {
    return null
  }

  const liveMode = variant === 'error' ? 'assertive' : 'polite'

  return (
    <div className="info-box-wrapper" aria-live={liveMode}>
      <div className={`info-box info-box-${variant}`} role="status">
        <p className="info-box-message">{message}</p>
        <button
          type="button"
          className="info-box-close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
        <div
          key={message}
          className="info-box-timer"
          style={{ '--duration': `${duration}ms` }}
        />
      </div>
    </div>
  )
}

export default InfoBox
