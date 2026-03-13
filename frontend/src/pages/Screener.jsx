import { useState } from 'react'
import './Screener.css'

function Screener() {
  const [stocks, setStocks] = useState([
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 182.45, change: 2.5, changePercent: 1.39, volume: '52.3M' },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.91, change: -1.25, changePercent: -0.33, volume: '28.1M' },
    { id: 3, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 139.67, change: 3.45, changePercent: 2.54, volume: '32.5M' },
    { id: 4, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 175.32, change: -0.88, changePercent: -0.50, volume: '45.8M' },
    { id: 5, symbol: 'TSLA', name: 'Tesla Inc.', price: 242.18, change: 5.12, changePercent: 2.16, volume: '118.2M' }
  ])

  const handleAddStock = () => {
    alert('Add new stock functionality coming soon!')
  }

  return (
    <div className="screener-container">
      <button className="add-stock-btn" onClick={handleAddStock}>
        + Add New Stock
      </button>
      <table className="stocks-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Price</th>
            <th>Change</th>
            <th>Change %</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.id}>
              <td className="symbol">{stock.symbol}</td>
              <td>{stock.name}</td>
              <td>${stock.price.toFixed(2)}</td>
              <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
              </td>
              <td className={stock.changePercent >= 0 ? 'positive' : 'negative'}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </td>
              <td>{stock.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Screener
