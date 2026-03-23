import { useEffect, useMemo, useState } from 'react'
import '../styles/Screener.css'
import InfoBox from '../components/InfoBox'

function Screener() {
  const screenerListEndpoints = ['/api/screener/screener_list', '/api/screener_list']
  const [tickerInput, setTickerInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [stocks, setStocks] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'asc' })

  const columns = [
    { key: 'ticker', label: 'Ticker' },
    { key: 'pe', label: 'PE' },
    { key: 'forward_pe', label: 'Forward PE' },
    { key: 'ps', label: 'PS' },
    { key: 'peg', label: 'PEG' },
    { key: 'revenue_growth', label: 'Revenue Growth' },
    { key: 'earnings_growth', label: 'Earnings Growth' }
  ]

  const getComparableValue = (stock, key) => {
    const value = stock?.[key]

    if (value === null || value === undefined || value === '') {
      return null
    }

    if (key === 'ticker') {
      return String(value).toUpperCase()
    }

    const numericValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isNaN(numericValue)) {
      return numericValue
    }

    return String(value).toUpperCase()
  }

  const sortedStocks = useMemo(() => {
    const { key, direction } = sortConfig
    const directionMultiplier = direction === 'asc' ? 1 : -1

    return [...stocks].sort((a, b) => {
      const aValue = getComparableValue(a, key)
      const bValue = getComparableValue(b, key)

      if (aValue === null && bValue === null) {
        return 0
      }

      if (aValue === null) {
        return 1
      }

      if (bValue === null) {
        return -1
      }

      if (aValue < bValue) {
        return -1 * directionMultiplier
      }

      if (aValue > bValue) {
        return 1 * directionMultiplier
      }

      return 0
    })
  }, [stocks, sortConfig])

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2)
    }

    return value
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    if (typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`
    }

    return value
  }

  const fetchScreenerList = async ({ showError = false } = {}) => {
    try {
      let lastError = null

      for (const endpoint of screenerListEndpoints) {
        const response = await fetch(endpoint)
        const data = await response.json().catch(() => null)

        if (response.ok) {
          setStocks(Array.isArray(data?.screener_list) ? data.screener_list : [])
          return
        }

        if (response.status === 404) {
          lastError = new Error('Screener endpoint not found (404).')
          continue
        }

        const apiErrorMessage = data?.Message || data?.error || `Failed to load screener table.`
        throw new Error(apiErrorMessage)
      }

      throw lastError || new Error('Failed to load screener data.')
    } catch (error) {
      console.error('Failed to fetch screener list:', error)

      if (showError) {
        setRequestStatus('error')
        setRequestMessage(error.message || 'Failed to load screener data.')
      }
    }
  }

  const handleAddStock = async () => {
    if (isSubmitting) {
      return
    }

    const ticker = tickerInput.trim().toUpperCase()

    if (!ticker) {
      setRequestStatus('error')
      setRequestMessage('Please enter a ticker symbol.')
      return
    }

    try {
      setIsSubmitting(true)
      setTickerInput('')
      setRequestMessage('')
      setRequestStatus('')

      const response = await fetch('/api/screener/add_ticker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticker })
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const apiErrorMessage = data?.Message || `Request failed with status ${response.status}`
        throw new Error(apiErrorMessage)
      }

      await fetchScreenerList()
      setRequestStatus('success')
      setRequestMessage(data?.Message || 'Ticker added successfully!')
    } catch (error) {
      console.error('Failed to add ticker:', error)
      setRequestStatus('error')
      setRequestMessage(error.message || 'Failed to add ticker.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchScreenerList({ showError: true })
  }, [])

  useEffect(() => {
    if (!requestMessage) {
      return undefined
    }

    const timer = setTimeout(() => {
      setRequestMessage('')
      setRequestStatus('')
    }, 5000)

    return () => clearTimeout(timer)
  }, [requestMessage, requestStatus])

  const handleSort = (columnKey) => {
    setSortConfig((currentSort) => {
      if (currentSort.key === columnKey) {
        return {
          key: columnKey,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
        }
      }

      return { key: columnKey, direction: 'asc' }
    })
  }

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕'
    }

    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="screener-container">
      <div className="add-stock-controls">
        <input
          type="text"
          className="ticker-input"
          value={tickerInput}
          onChange={(event) => setTickerInput(event.target.value)}
          placeholder="Enter ticker (e.g. AAPL)"
          maxLength={10}
        />
        <button
          className="add-stock-btn"
          onClick={handleAddStock}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : '+ Add New Stock'}
        </button>
      </div>
      <div className="stocks-table-container">
        <table className="stocks-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    className={`sort-header-btn ${sortConfig.key === column.key ? 'active' : ''}`}
                    onClick={() => handleSort(column.key)}
                    aria-label={`Sort by ${column.label}`}
                  >
                    <span>{column.label}</span>
                    <span className="sort-indicator" aria-hidden="true">{getSortIndicator(column.key)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock) => (
              <tr key={stock.ticker}>
                <td className="symbol">{stock.ticker}</td>
                <td>{formatValue(stock.pe)}</td>
                <td>{formatValue(stock.forward_pe)}</td>
                <td>{formatValue(stock.ps)}</td>
                <td>{formatValue(stock.peg)}</td>
                <td>{stock.revenue_growth}</td>
                <td>{stock.earnings_growth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InfoBox
        isVisible={Boolean(requestMessage)}
        message={requestMessage}
        variant={requestStatus || 'info'}
        onClose={() => {
          setRequestMessage('')
          setRequestStatus('')
        }}
      />
    </div>
  )
}

export default Screener
