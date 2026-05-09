import { useCallback, useEffect, useState } from 'react'
import '../styles/DividendPortfolio.css'

const DIVIDEND_OVERVIEW_ENDPOINTS = [
  '/api/dividend-portfolio/overview',
]

const formatCurrencySek = (value, maximumFractionDigits = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits,
  }).format(value)
}

const formatPercent = (value, maximumFractionDigits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return `${value.toFixed(maximumFractionDigits)}%`
}

const normalizeResponse = (payload) => {
  const root = payload?.dividend_portfolio_overview || payload?.overview || payload

  if (!root || typeof root !== 'object') {
    throw new Error('Dividend portfolio response has an unexpected shape.')
  }

  return {
    dividend_data: root.dividend_data && typeof root.dividend_data === 'object' ? root.dividend_data : {},
    holdings: Array.isArray(root.holdings) ? root.holdings : [],
    sector_percentage: Array.isArray(root.sector_percentage) ? root.sector_percentage : [],
    industry_percentage: Array.isArray(root.industry_percentage) ? root.industry_percentage : [],
    total_value_sek: typeof root.total_value_sek === 'number' ? root.total_value_sek : null,
  }
}

function DividendPortfolio() {
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [overview, setOverview] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')

  const fetchDividendOverview = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      let lastError = null

      for (const endpoint of DIVIDEND_OVERVIEW_ENDPOINTS) {
        const response = await fetch(endpoint)
        const data = await response.json().catch(() => null)

        if (response.ok) {
          setOverview(normalizeResponse(data))
          setLastUpdatedAt(new Date().toLocaleString('sv-SE'))
          return
        }

        if (response.status === 404) {
          lastError = new Error('Dividend overview endpoint not found (404).')
          continue
        }

        const apiError = data?.Message || data?.error || data?.message || `Failed with status ${response.status}.`
        throw new Error(apiError)
      }

      throw lastError || new Error('Failed to load dividend portfolio overview.')
    } catch (error) {
      console.error('Failed to load dividend portfolio overview:', error)
      setErrorMessage(error.message || 'Failed to load dividend portfolio overview.')
      setOverview(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDividendOverview()
  }, [fetchDividendOverview])

  const dividendData = overview?.dividend_data || {}
  const holdings = overview?.holdings || []

  return (
    <div className="dividend-page">
      <header className="dividend-header">
        <div>
          <h1>Dividend Portfolio</h1>
        </div>
      </header>

      {errorMessage && (
        <section className="dividend-error-wrap" aria-live="polite">
          <p>{errorMessage}</p>
        </section>
      )}

      {!errorMessage && (
        <>
          <section className="dividend-summary-grid" aria-label="Dividend summary">
            <article className="dividend-summary-card">
              <span>Portfolio Value</span>
              <strong>{formatCurrencySek(overview?.total_value_sek ?? null)}</strong>
            </article>
            <article className="dividend-summary-card">
              <span>Yearly Dividend</span>
              <strong>{formatCurrencySek(dividendData.yearly_dividend ?? null, 2)}</strong>
              <span>Yearly Dividend AT</span>
              <strong>{formatCurrencySek(dividendData.yearly_dividend_at ?? null, 2)}</strong>
            </article>
            <article className="dividend-summary-card">
              <span>Monthly Dividend</span>
              <strong>{formatCurrencySek(dividendData.monthly_divided ?? null, 2)}</strong>
              <span>Monthly Dividend AT</span>
              <strong>{formatCurrencySek(dividendData.monthly_dividend_at ?? null, 2)}</strong>
            </article>
            <article className="dividend-summary-card">
              <span>Daily Dividend</span>
              <strong>{formatCurrencySek(dividendData.daily_divided ?? null, 2)}</strong>
                <span>Daily Dividend AT</span>
                <strong>{formatCurrencySek(dividendData.daily_dividend_at ?? null, 2)}</strong>
            </article>
            <article className="dividend-summary-card">
              <span>Payouts / Year</span>
              <strong>{dividendData.payouts ?? '-'}</strong>
            </article>
            <article className="dividend-summary-card">
              <span>Holdings</span>
              <strong>{holdings.length}</strong>
            </article>
          </section>

          <section className="dividend-panel" aria-label="Dividend holdings table">
            <h2>Holdings</h2>
            <div className="dividend-table-wrap">
              <table className="dividend-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Quantity</th>
                    <th>Value</th>
                    <th>Portfolio %*</th>
                    <th>Yield</th>
                    <th>Yearly Dividend</th>
                    <th>Payouts</th>
                    <th>Sector</th>
                    <th>Industry</th>
                    <th>Accounts</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 && (
                    <tr>
                      <td colSpan={10}>No holdings returned from backend.</td>
                    </tr>
                  )}
                  {holdings.map((holding) => (
                    <tr key={holding.ticker}>
                      <td className="dividend-symbol">{holding.ticker || '-'}</td>
                      <td>{holding.quantity ?? '-'}</td>
                      <td>{formatCurrencySek(holding.holding_value_sek ?? null)}</td>
                      <td>{formatPercent(holding.holding_value_percentage ?? null)}</td>
                      <td>{formatPercent(holding.dividend_yield ?? null)}</td>
                      <td>{formatCurrencySek(holding.yearly_dividend_amount_sek ?? null)}</td>
                      <td>{holding.payouts ?? '-'}</td>
                      <td>{holding.sector || '-'}</td>
                      <td>{holding.industry || '-'}</td>
                      <td>{Array.isArray(holding.accounts) && holding.accounts.length > 0 ? holding.accounts.join(', ') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DividendPortfolio
