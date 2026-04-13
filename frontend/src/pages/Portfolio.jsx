import { useCallback, useEffect, useMemo, useState } from 'react'
import '../styles/Portfolio.css'
import InfoBox from '../components/InfoBox'

const PORTFOLIO_OVERVIEW_ENDPOINTS = ['/api/portfolio/overview', '/api/overview']

const formatCurrencySek = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return `${value.toFixed(2)} %`
}

const isAllocationWarning = (value) => {
  return typeof value === 'number' && !Number.isNaN(value) && value > 40
}

const getPointsTone = (type, points) => {
  const normalizedPoints = typeof points === 'number' ? points : Number(points)

  if (Number.isNaN(normalizedPoints) || normalizedPoints < 3) {
    return 'neutral'
  }

  return type === 'buy' ? 'buy' : 'sell'
}

function Portfolio() {
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [portfolioOverview, setPortfolioOverview] = useState(null)
  const [isUpdatingTickers, setIsUpdatingTickers] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestStatus, setRequestStatus] = useState('')

  const fetchPortfolioOverview = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      let lastError = null

      for (const endpoint of PORTFOLIO_OVERVIEW_ENDPOINTS) {
        const response = await fetch(endpoint)
        const data = await response.json().catch(() => null)

        if (response.ok) {
          const normalizedOverview =
            data?.portfolio_overview ||
            data?.overview ||
            data

          if (!normalizedOverview || typeof normalizedOverview !== 'object') {
            throw new Error('Portfolio response has an unexpected shape.')
          }

          setPortfolioOverview({
            holdings: Array.isArray(normalizedOverview.holdings) ? normalizedOverview.holdings : [],
            sector_percentage: Array.isArray(normalizedOverview.sector_percentage) ? normalizedOverview.sector_percentage : [],
            industry_percentage: Array.isArray(normalizedOverview.industry_percentage) ? normalizedOverview.industry_percentage : [],
            total_value_sek: typeof normalizedOverview.total_value_sek === 'number' ? normalizedOverview.total_value_sek : null,
          })
          return
        }

        if (response.status === 404) {
          lastError = new Error('Portfolio overview endpoint not found (404).')
          continue
        }

        const apiErrorMessage = data?.Message || data?.error || `Failed with status ${response.status}.`
        throw new Error(apiErrorMessage)
      }

      throw lastError || new Error('Failed to load portfolio overview.')
    } catch (error) {
      console.error('Failed to load portfolio overview:', error)
      setErrorMessage(error.message || 'Failed to load portfolio overview.')
      setPortfolioOverview(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolioOverview()
  }, [fetchPortfolioOverview])

  const holdings = portfolioOverview?.holdings || []
  const sectorRows = portfolioOverview?.sector_percentage || []
  const industryRows = portfolioOverview?.industry_percentage || []

  const portfolioTickers = useMemo(() => {
    return [...new Set(
      holdings
        .map((holding) => (typeof holding.ticker === 'string' ? holding.ticker.trim().toUpperCase() : ''))
        .filter(Boolean)
    )]
  }, [holdings])

  const summary = useMemo(() => {
    const totalHoldings = holdings.length

    return {
      totalHoldings,
      totalValueSek: portfolioOverview?.total_value_sek ?? null,
    }
  }, [holdings, portfolioOverview])

  const sectorConcentrationWarnings = useMemo(() => {
    return sectorRows
      .filter((row) => {
        const percentage = typeof row?.percentage === 'number' ? row.percentage : Number(row?.percentage)
        return !Number.isNaN(percentage) && percentage > 40
      })
      .map((row) => {
        return `Sector ${row?.sector || 'Unknown'} above 40%, should reduce.`
      })
  }, [sectorRows])

  const industryConcentrationWarnings = useMemo(() => {
    return industryRows
      .filter((row) => {
        const percentage = typeof row?.percentage === 'number' ? row.percentage : Number(row?.percentage)
        return !Number.isNaN(percentage) && percentage > 40
      })
      .map((row) => {
        return `Industry ${row?.industry || 'Unknown'} above 40%, should reduce.`
      })
  }, [industryRows])

  const signalNotifications = useMemo(() => {
    return holdings.flatMap((holding) => {
      const ticker = holding?.ticker || 'Unknown'
      const buyPointsRaw = holding?.buy_sell_signals?.buy_points
      const sellPointsRaw = holding?.buy_sell_signals?.sell_points
      const buyPoints = typeof buyPointsRaw === 'number' ? buyPointsRaw : Number(buyPointsRaw)
      const sellPoints = typeof sellPointsRaw === 'number' ? sellPointsRaw : Number(sellPointsRaw)
      const notifications = []

      if (!Number.isNaN(buyPoints) && buyPoints >= 3) {
        notifications.push(`Buy notification: ${ticker} has ${buyPoints} buy points.`)
      }

      if (!Number.isNaN(sellPoints) && sellPoints >= 3) {
        notifications.push(`Sell notification: ${ticker} has ${sellPoints} sell points.`)
      }

      return notifications
    })
  }, [holdings])

  const handleUpdateTickers = useCallback(async () => {
    if (isUpdatingTickers) {
      return
    }

    if (portfolioTickers.length === 0) {
      setRequestStatus('error')
      setRequestMessage('No portfolio tickers available to update.')
      return
    }

    setIsUpdatingTickers(true)
    setRequestStatus('')
    setRequestMessage('')

    try {
      const response = await fetch('/api/screener/update_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickers: portfolioTickers }),
      })

      const responseText = await response.text()
      let parsedPayload = null

      if (responseText) {
        try {
          parsedPayload = JSON.parse(responseText)
        } catch {
          parsedPayload = null
        }
      }

      if (!response.ok) {
        const apiError =
          parsedPayload?.Message ||
          parsedPayload?.error ||
          parsedPayload?.message ||
          responseText ||
          `Failed with status ${response.status}.`

        throw new Error(apiError)
      }

      setRequestStatus('success')
      setRequestMessage('Update completed')
      await fetchPortfolioOverview()
    } catch (error) {
      console.error('Failed to update portfolio tickers:', error)
      setRequestStatus('error')
      setRequestMessage(error.message || 'Failed to update portfolio tickers.')
    } finally {
      setIsUpdatingTickers(false)
    }
  }, [fetchPortfolioOverview, isUpdatingTickers, portfolioTickers])

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>Portfolio Overview</h1>
        <div className="portfolio-header-actions">
          <button type="button" className="portfolio-update-btn" onClick={handleUpdateTickers} disabled={isLoading || isUpdatingTickers}>
            {isUpdatingTickers ? 'Updating...' : 'Update Tickers'}
          </button>
          <button type="button" className="portfolio-refresh-btn" onClick={fetchPortfolioOverview} disabled={isLoading || isUpdatingTickers}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="portfolio-error-wrap">
          <p className="portfolio-error">{errorMessage}</p>
          <button type="button" className="portfolio-refresh-btn" onClick={fetchPortfolioOverview}>
            Retry
          </button>
        </div>
      )}

      {!errorMessage && (
        <>
          <section className="portfolio-summary-grid" aria-label="Portfolio summary">
            <article className="portfolio-summary-card">
              <span className="portfolio-summary-label">Total Value</span>
              <strong>{formatCurrencySek(summary.totalValueSek)}</strong>
            </article>
          </section>

          <div className="portfolio-content-layout">
            <div className="portfolio-main-content">
              <section className="portfolio-section" aria-label="Current holdings">
                <h2>Holdings</h2>
                <div className="portfolio-table-wrap">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th>Ticker</th>
                        <th>Quantity</th>
                        <th>Value (SEK)</th>
                        <th>Value %</th>
                        <th>Sector</th>
                        <th>Industry</th>
                        <th>Accounts</th>
                        <th>Buy/Sell Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.length === 0 && (
                        <tr>
                          <td colSpan={8}>No holdings returned from backend.</td>
                        </tr>
                      )}
                      {holdings.map((holding) => (
                        <tr key={holding.ticker}>
                          <td className="portfolio-symbol">{holding.ticker || '-'}</td>
                          <td>{holding.quantity ?? '-'}</td>
                          <td>{formatCurrencySek(holding.holding_value_sek)}</td>
                          <td>{formatPercent(holding.holding_value_percentage)}</td>
                          <td>{holding.sector || '-'}</td>
                          <td>{holding.industry || '-'}</td>
                          <td>{Array.isArray(holding.accounts) && holding.accounts.length > 0 ? holding.accounts.join(', ') : '-'}</td>
                          <td>
                            <div className="portfolio-points-wrap">
                              <span className={`portfolio-points-badge portfolio-points-badge--${getPointsTone('buy', holding.buy_sell_signals?.buy_points)}`}>
                                Buy: {holding.buy_sell_signals?.buy_points ?? 0}
                              </span>
                              <span className={`portfolio-points-badge portfolio-points-badge--${getPointsTone('sell', holding.buy_sell_signals?.sell_points)}`}>
                                Sell: {holding.buy_sell_signals?.sell_points ?? 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="portfolio-breakdown-grid">
                <section className="portfolio-section" aria-label="Sector allocation">
                  <h2>Sector Allocation</h2>
                  <div className="portfolio-table-wrap">
                    <table className="portfolio-table">
                      <thead>
                        <tr>
                          <th>Sector</th>
                          <th>Value (SEK)</th>
                          <th>Percentage</th>
                          <th>Tickers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectorRows.length === 0 && (
                          <tr>
                            <td colSpan={4}>No sector data available.</td>
                          </tr>
                        )}
                        {sectorRows.map((row) => (
                          <tr key={row.sector} className={isAllocationWarning(row.percentage) ? 'portfolio-allocation-warning' : ''}>
                            <td>{row.sector || '-'}</td>
                            <td>{formatCurrencySek(row.value_sek)}</td>
                            <td>{formatPercent(row.percentage)}</td>
                            <td>{Array.isArray(row.tickers) && row.tickers.length > 0 ? row.tickers.join(', ') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="portfolio-section" aria-label="Industry allocation">
                  <h2>Industry Allocation</h2>
                  <div className="portfolio-table-wrap">
                    <table className="portfolio-table">
                      <thead>
                        <tr>
                          <th>Industry</th>
                          <th>Value (SEK)</th>
                          <th>Percentage</th>
                          <th>Tickers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {industryRows.length === 0 && (
                          <tr>
                            <td colSpan={4}>No industry data available.</td>
                          </tr>
                        )}
                        {industryRows.map((row) => (
                          <tr key={row.industry} className={isAllocationWarning(row.percentage) ? 'portfolio-allocation-warning' : ''}>
                            <td>{row.industry || '-'}</td>
                            <td>{formatCurrencySek(row.value_sek)}</td>
                            <td>{formatPercent(row.percentage)}</td>
                            <td>{Array.isArray(row.tickers) && row.tickers.length > 0 ? row.tickers.join(', ') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <aside className="portfolio-todo-panel" aria-label="Todo list">
              <h2>Todo list</h2>
              <ul className="portfolio-todo-list">
                {sectorConcentrationWarnings.map((warning) => (
                  <li key={warning} className="portfolio-check-item portfolio-check-item--warning">{warning}</li>
                ))}

                {industryConcentrationWarnings.map((warning) => (
                  <li key={warning} className="portfolio-check-item portfolio-check-item--warning">{warning}</li>
                ))}

                {signalNotifications.map((notification) => (
                  <li key={notification} className="portfolio-check-item portfolio-check-item--signal">{notification}</li>
                ))}

                {sectorConcentrationWarnings.length === 0 && industryConcentrationWarnings.length === 0 && signalNotifications.length === 0 && (
                  <li className="portfolio-check-item">No concentration warnings above 40%.</li>
                )}
              </ul>
            </aside>
          </div>
        </>
      )}

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

export default Portfolio
