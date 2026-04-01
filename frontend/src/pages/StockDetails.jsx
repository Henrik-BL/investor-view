import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import '../styles/StockDetails.css'

const buildStockDetailEndpoint = (ticker) => `/api/screener/fetch_stock_data?ticker=${encodeURIComponent(ticker)}`

const fieldLabels = {
  ticker: 'Ticker',
  market_cap: 'Market Cap',
  pe: 'P/E',
  forward_pe: 'Forward P/E',
  ps: 'P/S',
  pb: 'P/B',
  peg: 'PEG',
  revenue_growth: 'Revenue Growth',
  earnings_growth: 'Earnings Growth',
  last_quarter_date: 'Date',
  last_quarter_revenue: 'Revenue',
  last_quarter_net_income: 'Net Income',
  last_quarter_margin: 'Margin',
  last_quarter_free_cashflow: 'Free Cashflow',
  last_quarter_free_cashflow_yield: 'Free Cashflow Yield',
  last_quarter_pe: 'P/E',
  price: 'Price',
  sma_225: 'SMA 225',
  rsi_14: 'RSI 14',
  sma_225_diff: 'SMA 225 Diff',
  quarterly_revenue_cagr: 'Quarterly Revenue CAGR',
  quarterly_net_income_cagr: 'Quarterly Net Income CAGR',
  quarterly_free_cashflow_cagr: 'Quarterly Free Cashflow CAGR',
  yearly_revenue_cagr: 'Yearly Revenue CAGR',
  yearly_net_income_cagr: 'Yearly Net Income CAGR',
  yearly_free_cashflow_cagr: 'Yearly Free Cashflow CAGR',
  current_ratio: 'Current Ratio',
  debt_to_equity: 'Debt to Equity',
  quarterly_total_debt_cagr: 'Quarterly Total Debt CAGR',
  dividend_yield: 'Dividend Yield',
  five_year_dividend_cagr: '5 Year Dividend CAGR',
  ten_year_dividend_cagr: '10 Year Dividend CAGR',
  consecutive_dividend_increases: 'Consecutive Dividend Increases',
  payouts: 'Payouts'
}

const companyInfoKeys = ['name', 'sector', 'industry', 'market_cap', 'beta']

const valuationKeys = ['pe', 'forward_pe', 'peg', 'ps', 'pb']

const latestQuarterKeys = ['last_quarter_date', 'last_quarter_revenue', 'last_quarter_net_income', 'last_quarter_free_cashflow', 'last_quarter_margin', 'last_quarter_free_cashflow_yield', 'last_quarter_pe']

const technicalKeys = ['price', 'sma_225', 'sma_225_diff', 'rsi_14']

const growthKeys = ['revenue_growth', 'earnings_growth' ]

const financialHealthKeys = ['current_ratio', 'debt_to_equity']

const dividendKeys = ['dividend_yield', 'five_year_dividend_cagr', 'ten_year_dividend_cagr', 'consecutive_dividend_increases', 'payouts']

const formatLabel = (key) => {
  if (fieldLabels[key]) {
    return fieldLabels[key]
  }

  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '-'
    }

    return value
      .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

const formatMarketCapValue = (value, currencyCode) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return formatValue(value)
  }

  const absoluteValue = Math.abs(value)
  const formattedCurrency = currencyCode ? String(currencyCode).toUpperCase() : 'N/A'

  if (absoluteValue >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T (${formattedCurrency})`
  }

  if (absoluteValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B (${formattedCurrency})`
  }

  if (absoluteValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M (${formattedCurrency})`
  }

  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} (${formattedCurrency})`
}

const formatTableValue = (key, value, currencyCode) => {
  if (key === 'market_cap') {
    return formatMarketCapValue(value, currencyCode)
  }

  if (key === 'last_quarter_revenue' || key === 'last_quarter_net_income' || key === 'last_quarter_free_cashflow') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return formatValue(value)
    }
    const absoluteValue = Math.abs(value)
    if (absoluteValue >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`
    }
    if (absoluteValue >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    }
    return formatValue(value)
  }

  if (
    key === 'last_quarter_margin' ||
    key === 'last_quarter_free_cashflow_yield' ||
    key === 'debt_to_equity' ||
    key === 'quarterly_total_debt_cagr' ||
    key === 'five_year_dividend_cagr' ||
    key === 'ten_year_dividend_cagr' ||
    key === 'revenue_growth' ||
    key === 'earnings_growth' ||
    key === 'quarterly_revenue_cagr' ||
    key === 'quarterly_net_income_cagr' ||
    key === 'quarterly_free_cashflow_cagr' ||
    key === 'yearly_revenue_cagr' ||
    key === 'yearly_net_income_cagr' ||
    key === 'yearly_free_cashflow_cagr' ||
    key === 'sma_225_diff'
  ) {
    const formattedValue = formatValue(value)
    return formattedValue === '-' ? formattedValue : `${formattedValue} %`
  }

  return formatValue(value)
}

const reportMetricOptions = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'net_income', label: 'Net Income' },
  { key: 'free_cashflow', label: 'Free Cashflow' },
  { key: 'total_debt', label: 'Total Debt' },
  { key: 'outstanding_shares', label: 'Outstanding Shares' },
  { key: 'diluted_outstanding_shares', label: 'Diluted Shares' },
  { key: 'net_margin', label: 'Net Margin' },
]

const cagrMetricOptions = [
  { key: 'revenue', label: 'Revenue CAGR' },
  { key: 'net_income', label: 'Net Income CAGR' },
  { key: 'free_cashflow', label: 'Free Cashflow CAGR' },
  { key: 'total_debt', label: 'Total Debt CAGR' },
  { key: 'outstanding_shares', label: 'Outstanding Shares CAGR' },
  { key: 'diluted_outstanding_shares', label: 'Diluted Shares CAGR' },
]

const detailTabOptions = [
  { key: 'analysis', label: 'Analysis' },
]

const cagrMetricLabelsByKey = cagrMetricOptions.reduce((accumulator, item) => {
  accumulator[item.key] = item.label
  return accumulator
}, {})

const reportCagrFieldCandidates = {
  quarterly: {
    revenue: ['quarterly_revenue_cagr'],
    net_income: ['quarterly_net_income_cagr'],
    free_cashflow: ['quarterly_free_cashflow_cagr'],
    total_debt: ['quarterly_total_debt_cagr'],
    outstanding_shares: ['quarterly_outstanding_shares_cagr'],
    diluted_outstanding_shares: ['quarterly_diluted_outstanding_shares_cagr'],
  },
  yearly: {
    revenue: ['yearly_revenue_cagr'],
    net_income: ['yearly_net_income_cagr'],
    free_cashflow: ['yearly_free_cashflow_cagr'],
    total_debt: ['yearly_total_debt_cagr'],
    outstanding_shares: ['yearly_outstanding_shares_cagr'],
    diluted_outstanding_shares: ['yearly_diluted_outstanding_shares_cagr'],
  },
}

const getFirstPresentValue = (object, keys) => {
  if (!object || typeof object !== 'object') {
    return null
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== null && object[key] !== undefined) {
      return object[key]
    }
  }

  return null
}

const formatCagrValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (typeof value === 'number') {
    return `${value.toFixed(2)} %`
  }

  const normalized = String(value).trim()
  if (normalized === '') {
    return '-'
  }

  if (normalized.endsWith('%')) {
    return normalized
  }

  return `${normalized} %`
}

const getReportCagrValue = (details, metric, type) => {
  const candidates = [
    ...(reportCagrFieldCandidates[type]?.[metric] || []),
    `${type}_${metric}_cagr`,
    `${metric}_cagr_${type}`,
    `${metric}_cagr`,
  ]

  const directValue = getFirstPresentValue(details, candidates)
  if (directValue !== null) {
    return directValue
  }

  const nestedContainers = [details?.cagr, details?.cagrs, details?.[`${type}_cagr`], details?.[`${type}_cagrs`]]
  for (const container of nestedContainers) {
    const nestedValue = getFirstPresentValue(container, [metric, `${metric}_cagr`])
    if (nestedValue !== null) {
      return nestedValue
    }
  }

  return null
}

const formatReportDate = (date, type) => {
  if (!date) return ''
  const [year, month] = date.split('-')
  if (type === 'yearly') return year
  const quarterMap = { '03': 'Q1', '06': 'Q2', '09': 'Q3', '12': 'Q4' }
  return `${quarterMap[month] ?? month} ${year}`
}

const formatReportValue = (value, metric) => {
  if (value === null || value === undefined) return '-'
  if (metric === 'net_margin') return `${value.toFixed(2)}%`
  if (metric === 'outstanding_shares' || metric === 'diluted_outstanding_shares') {
    return `${(value / 1_000_000_000).toFixed(3)}B`
  }
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  return value.toFixed(2)
}

const formatReportAxisTick = (value, metric) => {
  if (metric === 'net_margin') return `${Number(value).toFixed(0)}%`
  if (metric === 'outstanding_shares' || metric === 'diluted_outstanding_shares') {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  return String(value)
}

function StockDetails() {
  const { ticker: routeTicker = '' } = useParams()
  const location = useLocation()
  const selectedTicker = decodeURIComponent(routeTicker).toUpperCase()
  const selectedStock = location.state?.stock || null

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [stockDetails, setStockDetails] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState(detailTabOptions[0].key)
  const [reportType, setReportType] = useState('quarterly')
  const [reportMetric, setReportMetric] = useState('revenue')
  const [forecastQuarterInput, setForecastQuarterInput] = useState('5')
  const [forecastCagrInput, setForecastCagrInput] = useState('')
  const [forecastMarginInput, setForecastMarginInput] = useState('')

  const fetchStockDetails = useCallback(async () => {
    if (!selectedTicker) {
      setErrorMessage('Ticker was not provided in the route.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const endpoint = buildStockDetailEndpoint(selectedTicker)
      const response = await fetch(endpoint)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const apiErrorMessage = data?.Message || data?.error || `Failed with status ${response.status}.`
        throw new Error(apiErrorMessage)
      }

      const normalizedDetails =
        data?.stock_data ||
        data?.stock ||
        data?.data ||
        data

      if (!normalizedDetails || typeof normalizedDetails !== 'object') {
        throw new Error('Stock details response has an unexpected shape.')
      }

      setStockDetails(normalizedDetails)
    } catch (error) {
      console.error('Failed to load stock details:', error)
      setErrorMessage(error.message || 'Failed to load stock details.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedTicker])

  useEffect(() => {
    fetchStockDetails()
  }, [fetchStockDetails])

  useEffect(() => {
    const backendCagr = stockDetails?.quarterly_revenue_cagr
    if (typeof backendCagr === 'number') {
      setForecastCagrInput(String(backendCagr))
    }

    const backendMargin = stockDetails?.last_quarter_margin
    const quarterRevenue = stockDetails?.last_quarter_revenue
    const quarterNetIncome = stockDetails?.last_quarter_net_income
    let inferredMargin = null

    if (typeof backendMargin === 'number') {
      inferredMargin = backendMargin
    } else if (
      typeof quarterRevenue === 'number' &&
      quarterRevenue !== 0 &&
      typeof quarterNetIncome === 'number'
    ) {
      inferredMargin = (quarterNetIncome / quarterRevenue) * 100
    }

    if (typeof inferredMargin === 'number' && !Number.isNaN(inferredMargin)) {
      setForecastMarginInput(inferredMargin.toFixed(2))
    }
  }, [stockDetails])

  const snapshotEntries = useMemo(() => {
    if (!selectedStock || typeof selectedStock !== 'object') {
      return []
    }

    return Object.entries(selectedStock).filter(
      ([key]) => key !== 'ticker' && !companyInfoKeys.includes(key)
    )
  }, [selectedStock])

  const companyInfoEntries = useMemo(() => {
    return companyInfoKeys.map((key) => {
      const detailsValue = stockDetails?.[key]
      const snapshotValue = selectedStock?.[key]
      const value = detailsValue ?? snapshotValue ?? null

      return [key, value]
    })
  }, [stockDetails, selectedStock])

  const valuationEntries = useMemo(() => {
    return valuationKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const latestQuarterEntries = useMemo(() => {
    return latestQuarterKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const technicalEntries = useMemo(() => {
    return technicalKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const growthEntries = useMemo(() => {
    return growthKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const financialHealthEntries = useMemo(() => {
    return financialHealthKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const dividendEntries = useMemo(() => {
    return dividendKeys.map((key) => {
      const value = stockDetails?.[key] ?? null
      return [key, value]
    })
  }, [stockDetails])

  const tableOneEntries = companyInfoEntries
  const tableTwoEntries = valuationEntries
  const tableThreeEntries = latestQuarterEntries
  const tableFourEntries = technicalEntries
  const tableFiveEntries = growthEntries
  const tableSixEntries = financialHealthEntries
  const tableSevenEntries = dividendEntries
  const marketCapCurrency = stockDetails?.currency ?? selectedStock?.currency

  const reportChartData = useMemo(() => {
    const reports = reportType === 'quarterly'
      ? stockDetails?.quarterly_reports
      : stockDetails?.yearly_reports
    if (!Array.isArray(reports)) return []
    return reports.map((r) => ({
      date: formatReportDate(r.date, reportType),
      value: r[reportMetric] ?? null,
    }))
  }, [stockDetails, reportType, reportMetric])

  const selectedCagr = useMemo(() => {
    const cagrLabel = cagrMetricLabelsByKey[reportMetric] || null
    if (!cagrLabel) {
      return {
        label: `${formatLabel(reportMetric)} CAGR`,
        value: null,
        isSupportedMetric: false,
      }
    }

    return {
      label: cagrLabel,
      value: getReportCagrValue(stockDetails, reportMetric, reportType),
      isSupportedMetric: true,
    }
  }, [stockDetails, reportMetric, reportType])

  const revenueValuation = useMemo(() => {
    const quarterRevenue = stockDetails?.last_quarter_revenue
    const cagr = Number.parseFloat(forecastCagrInput)
    const quarters = Number.parseInt(forecastQuarterInput, 10)
    const margin = Number.parseFloat(forecastMarginInput)

    if (
      typeof quarterRevenue !== 'number' ||
      Number.isNaN(cagr) ||
      Number.isNaN(quarters) ||
      Number.isNaN(margin) ||
      quarters < 1
    ) {
      return null
    }

    const multiplier = 1 + cagr / 100
    let forecastRevenue = quarterRevenue
    for (let i = 0; i < quarters; i++) {
      forecastRevenue = forecastRevenue * multiplier
    }

    const forecastAnnualRevenue = forecastRevenue * 4
    const forecastAnnualNetIncome = forecastAnnualRevenue * (margin / 100)
    const marketCap = stockDetails?.market_cap
    const forecastedPs = typeof marketCap === 'number' && forecastAnnualRevenue !== 0
      ? marketCap / forecastAnnualRevenue
      : null
    const forecastedPe =
      typeof marketCap === 'number' &&
      typeof forecastAnnualNetIncome === 'number' &&
      forecastAnnualNetIncome > 0
        ? marketCap / forecastAnnualNetIncome
        : null

    return {
      cagr,
      quarters,
      forecastRevenue,
      forecastAnnualRevenue,
      forecastMargin: margin,
      forecastAnnualNetIncome,
      forecastedPs,
      forecastedPe,
    }
  }, [stockDetails, forecastCagrInput, forecastQuarterInput, forecastMarginInput])

  const companyDisplayName = stockDetails?.name ?? selectedStock?.name ?? (selectedTicker || 'Stock')


  return (
    <div className="stock-details-page">
      <div className="stock-details-header">
        <Link to="/screener" className="stock-details-back-link">← Back to Screener</Link>
        <h1 className="stock-details-header-title">
          <span>{companyDisplayName}</span>
          {selectedTicker && <span className="stock-details-header-ticker">({selectedTicker})</span>}
        </h1>
      </div>

      {isLoading && <p className="stock-details-status">Loading stock details...</p>}

      {errorMessage && (
        <div className="stock-details-error-wrap">
          <p className="stock-details-error">{errorMessage}</p>
          <button type="button" className="stock-details-retry-btn" onClick={fetchStockDetails}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && (companyInfoEntries.length > 0 || snapshotEntries.length > 0) && (
        <section aria-label="Screener snapshot">
          <div className="stock-details-tables">
            <div className="stock-details-table-wrap">
              <h3>Company info</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableOneEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableOneEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Valuation</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableTwoEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableTwoEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Latest quarter</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableThreeEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableThreeEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Technical</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableFourEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableFourEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Growth</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableFiveEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableFiveEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Financial Health</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableSixEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableSixEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stock-details-table-wrap">
              <h3>Dividend</h3>
              <table className="stock-details-table">
                <tbody>
                  {tableSevenEntries.length === 0 && (
                    <tr>
                      <td colSpan={2}>No data available</td>
                    </tr>
                  )}

                  {tableSevenEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td>{formatLabel(key)}</td>
                      <td>{formatTableValue(key, value, marketCapCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {!isLoading && !errorMessage && (
        <section className="stock-details-tabs-section" aria-label="Stock analysis">
          <div className="stock-details-tabs" role="tablist" aria-label="Stock analysis views">
            {detailTabOptions.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`stock-details-tab-${tab.key}`}
                aria-selected={activeDetailTab === tab.key}
                aria-controls={`stock-details-panel-${tab.key}`}
                className={`stock-details-tab-btn${activeDetailTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveDetailTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="stock-details-tab-panel"
            role="tabpanel"
            id={`stock-details-panel-${activeDetailTab}`}
            aria-labelledby={`stock-details-tab-${activeDetailTab}`}
          >
            {activeDetailTab === 'analysis' && (
              <div className="stock-details-charts-row">
                <section className="stock-details-charts-section" aria-label="Reports chart">
                  <h2 className="stock-details-charts-title">Financial Reports</h2>
                  <div className="stock-details-chart-controls">
                    <div className="stock-details-chart-toggle">
                      <button
                        type="button"
                        className={`stock-details-chart-toggle-btn${reportType === 'quarterly' ? ' active' : ''}`}
                        onClick={() => setReportType('quarterly')}
                      >
                        Quarterly
                      </button>
                      <button
                        type="button"
                        className={`stock-details-chart-toggle-btn${reportType === 'yearly' ? ' active' : ''}`}
                        onClick={() => setReportType('yearly')}
                      >
                        Yearly
                      </button>
                    </div>
                    <div className="stock-details-chart-metric-select">
                      {reportMetricOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`stock-details-chart-metric-btn${reportMetric === opt.key ? ' active' : ''}`}
                          onClick={() => setReportMetric(opt.key)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="stock-details-chart-wrap">
                    <div className="stock-details-chart-content">
                      <div className="stock-details-chart-main">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={reportChartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#475569' }} />
                            <YAxis
                              tickFormatter={(v) => formatReportAxisTick(v, reportMetric)}
                              tick={{ fontSize: 11, fill: '#475569' }}
                              width={60}
                            />
                            <Tooltip
                              formatter={(value) => [
                                formatReportValue(value, reportMetric),
                                reportMetricOptions.find((o) => o.key === reportMetric)?.label,
                              ]}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="stock-details-chart-cagr-panel" aria-label="CAGR summary">
                        <div className="stock-details-cagr-wrap">
                          <div className="stock-details-cagr-item">
                            <span className="stock-details-cagr-label">{selectedCagr.label}</span>
                            <span className="stock-details-cagr-value">{formatCagrValue(selectedCagr.value)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="stock-details-charts-section" aria-label="Quarterly forecast">
                  <h2 className="stock-details-charts-title">Quarterly Forecast</h2>
                  <div className="stock-details-forecast-controls">
                    <label className="stock-details-forecast-control">
                      <span>Quarters</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={forecastQuarterInput}
                        onChange={(event) => setForecastQuarterInput(event.target.value)}
                      />
                    </label>
                    <label className="stock-details-forecast-control">
                      <span>Revenue CAGR (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={forecastCagrInput}
                        onChange={(event) => setForecastCagrInput(event.target.value)}
                      />
                    </label>
                    <label className="stock-details-forecast-control">
                      <span>Net Margin (%)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={forecastMarginInput}
                        onChange={(event) => setForecastMarginInput(event.target.value)}
                      />
                    </label>
                  </div>
                  {revenueValuation ? (
                    <div className="stock-details-cagr-wrap">
                      <div className="stock-details-cagr-item">
                        <span className="stock-details-cagr-label">Forecasted Revenue (+{revenueValuation.quarters}Q)</span>
                        <span className="stock-details-cagr-value">{formatReportValue(revenueValuation.forecastRevenue, 'revenue')}</span>
                      </div>
                      <div className="stock-details-cagr-item">
                        <span className="stock-details-cagr-label">Forecasted Annual Revenue (×4)</span>
                        <span className="stock-details-cagr-value">{formatReportValue(revenueValuation.forecastAnnualRevenue, 'revenue')}</span>
                      </div>
                      <div className="stock-details-cagr-item">
                        <span className="stock-details-cagr-label">Forecasted Net Margin</span>
                        <span className="stock-details-cagr-value">{formatCagrValue(revenueValuation.forecastMargin)}</span>
                      </div>
                      <div className="stock-details-cagr-item">
                        <span className="stock-details-cagr-label">Forecasted Annual Net Income</span>
                        <span className="stock-details-cagr-value">{formatReportValue(revenueValuation.forecastAnnualNetIncome, 'net_income')}</span>
                      </div>
                      <div className="stock-details-cagr-item stock-details-cagr-item--total">
                        <span className="stock-details-cagr-label">Forecasted P/S</span>
                        <span className="stock-details-cagr-value">{revenueValuation.forecastedPs !== null ? revenueValuation.forecastedPs.toFixed(2) : '-'}</span>
                      </div>
                      <div className="stock-details-cagr-item stock-details-cagr-item--total">
                        <span className="stock-details-cagr-label">Forecasted P/E</span>
                        <span className="stock-details-cagr-value">{revenueValuation.forecastedPe !== null ? revenueValuation.forecastedPe.toFixed(2) : '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="stock-details-status">No data available</p>
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      )}


    </div>
  )
}

export default StockDetails
