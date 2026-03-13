import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Screener from './pages/Screener'
import Portfolio from './pages/Portfolio'
import DividendPortfolio from './pages/DividendPortfolio'

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Screener />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/dividend-portfolio" element={<DividendPortfolio />} />
        </Routes>
      </main>
    </>
  )
}

export default App
