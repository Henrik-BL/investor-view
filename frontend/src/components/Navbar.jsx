import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Navbar.css'

function Navbar() {
  const [backendStatus, setBackendStatus] = useState('unknown')

  useEffect(() => {
    const check = () => {
      fetch('/api/health')
        .then((res) => setBackendStatus(res.ok ? 'online' : 'offline'))
        .catch(() => setBackendStatus('offline'))
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusLabel = backendStatus === 'online' ? 'Backend online' : backendStatus === 'offline' ? 'Backend offline' : 'Checking backend'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          Investor View
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/screener" className="nav-link">
              Screener
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/portfolio" className="nav-link">
              Portfolio
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/dividend-portfolio" className="nav-link">
              Dividend Portfolio
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/update-data" className="nav-link">
              Update Data
            </Link>
          </li>
        </ul>
        <div className={`backend-status backend-status-${backendStatus}`} title={statusLabel} aria-label={statusLabel} />
      </div>
    </nav>
  )
}

export default Navbar
