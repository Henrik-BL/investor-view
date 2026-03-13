import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
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
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
