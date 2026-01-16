import { useMemo, useState } from 'react'

const TICK_VALUES = {
  ES: 12.5,
  MES: 1.25,
  NQ: 5,
  MNQ: 0.5,
  RTY: 5,
  M2K: 0.5,
  NKD: 25,
  MBT: 0.5,
  MET: 0.25,
  '6A': 10,
  '6B': 6.25,
  '6C': 10,
  '6E': 6.25,
  '6J': 6.25,
  '6S': 12.5,
  E7: 6.25,
  M6E: 1.25,
  M6A: 1,
  '6M': 5,
  '6N': 10,
  M6B: 0.625,
  HE: 10,
  LE: 10,
  CL: 10,
  QM: 12.5,
  NG: 10,
  QG: 12.5,
  MCL: 1,
  RB: 4.2,
  HO: 4.2,
  PL: 5,
  MNG: 2.5,
  ZC: 12.5,
  ZW: 12.5,
  ZS: 12.5,
  ZM: 10,
  ZL: 6,
  YM: 5,
  MYM: 0.5,
  ZT: 15.625,
  ZF: 7.8125,
  ZN: 15.625,
  TN: 15.625,
  ZB: 31.25,
  UB: 31.25,
  GC: 10,
  SI: 25,
  HG: 12.5,
  MGC: 1,
  SIL: 5,
  MHG: 1.25,
} as const

type AssetKey = keyof typeof TICK_VALUES | 'Custom'

type Errors = Partial<
  Record<
    | 'maxContractSize'
    | 'maxLoss'
    | 'profitTarget'
    | 'dailyLossCap'
    | 'tradesToBust'
    | 'stopTicks'
    | 'tickValue',
    string
  >
>

type Results = {
  riskPerTrade: number
  riskPerContract: number
  suggestedContracts: number
  riskPerTradeTicks: number
  maxTradesPerDay?: number
  dailyProfitThreshold?: number
}

type ValueChangeEvent = {
  target: {
    value: string
  }
}

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

const formatNumber = (value: number) =>
  value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })

function App() {
  const [maxContractSize, setMaxContractSize] = useState('1')
  const [maxLoss, setMaxLoss] = useState('2500')
  const [dailyLossCap, setDailyLossCap] = useState('')
  const [profitTarget, setProfitTarget] = useState('')
  const [tradesToBust, setTradesToBust] = useState('10')
  const [asset, setAsset] = useState<AssetKey>('ES')
  const [customTickValue, setCustomTickValue] = useState('')
  const [stopTicks, setStopTicks] = useState('12')
  const [applyConsistencyRule, setApplyConsistencyRule] = useState(false)
  const [consistencyRule, setConsistencyRule] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [results, setResults] = useState<Results | null>(null)
  const [isStale, setIsStale] = useState(false)

  const tickValue = useMemo(() => {
    if (asset === 'Custom') {
      return Number(customTickValue)
    }
    return TICK_VALUES[asset]
  }, [asset, customTickValue])

  const markInputsChanged = () => {
    if (results) {
      setIsStale(true)
    }
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const handleCalculate = () => {
    setIsStale(false)
    const nextErrors: Errors = {}
    const maxContractSizeValue = Number(maxContractSize)
    const maxLossValue = Number(maxLoss)
    const profitTargetValue = Number(profitTarget)
    const tradesToBustValue = Number(tradesToBust)
    const stopTicksValue = Number(stopTicks)
    const dailyLossCapValue = Number(dailyLossCap)

    if (profitTarget.trim() === '') {
      nextErrors.profitTarget = 'Profit Target is required.'
    } else if (!Number.isFinite(profitTargetValue) || profitTargetValue <= 0) {
      nextErrors.profitTarget = 'Profit Target must be greater than 0.'
    }

    if (!Number.isFinite(maxContractSizeValue) || maxContractSizeValue < 1) {
      nextErrors.maxContractSize = 'Enter a whole number of at least 1.'
    }

    if (!Number.isFinite(maxLossValue) || maxLossValue <= 0) {
      nextErrors.maxLoss = 'Max loss must be greater than 0.'
    }

    if (tradesToBust.trim() === '') {
      nextErrors.tradesToBust = 'Trades until account is lost is required.'
    } else if (!Number.isFinite(tradesToBustValue) || tradesToBustValue < 1) {
      nextErrors.tradesToBust = 'Trades until account is lost must be at least 1.'
    }

    if (!Number.isFinite(stopTicksValue) || stopTicksValue <= 0) {
      nextErrors.stopTicks = 'Stop loss size must be greater than 0.'
    }

    if (!Number.isFinite(tickValue) || tickValue <= 0) {
      nextErrors.tickValue = 'Tick value must be greater than 0.'
    }

    if (dailyLossCap.trim() === '') {
      nextErrors.dailyLossCap =
        "Even if the prop firm doesn't have a Daily Loss Limit, you should still have one as part of your trading plan."
    } else if (!Number.isFinite(dailyLossCapValue) || dailyLossCapValue <= 0) {
      nextErrors.dailyLossCap = 'Daily loss limit must be greater than 0.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setResults(null)
      setIsStale(false)
      return
    }

    const riskPerTrade = maxLossValue / tradesToBustValue
    const riskPerContract = stopTicksValue * tickValue
    const suggestedContractsRaw = Math.floor(riskPerTrade / riskPerContract)
    const suggestedContracts = Math.min(
      suggestedContractsRaw,
      Math.floor(maxContractSizeValue),
    )
    const riskPerTradeTicks = riskPerTrade / tickValue

    if (riskPerTrade > dailyLossCapValue) {
      setErrors({
        dailyLossCap:
          'Daily loss cap is lower than risk per trade. Increase the cap or reduce risk.',
      })
      setResults(null)
      setIsStale(false)
      return
    }

    const nextResults: Results = {
      riskPerTrade,
      riskPerContract,
      suggestedContracts,
      riskPerTradeTicks,
    }

    nextResults.maxTradesPerDay = Math.floor(dailyLossCapValue / riskPerTrade)
    nextResults.dailyProfitThreshold = dailyLossCapValue

    setErrors({})
    setResults(nextResults)
    setIsStale(false)
  }

  const showWarning = results ? results.suggestedContracts < 1 : false
  const profitTargetValue = Number(profitTarget)
  const consistencyRuleValue = Number(consistencyRule)
  const showMaxDailyProfit =
    applyConsistencyRule &&
    consistencyRule.trim() !== '' &&
    Number.isFinite(consistencyRuleValue) &&
    consistencyRuleValue > 0 &&
    Number.isFinite(profitTargetValue) &&
    profitTargetValue > 0
  const maxDailyProfit = profitTargetValue * (consistencyRuleValue / 100)

  return (
    <div className="min-h-screen px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <header className="glass-panel mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl px-6 py-4 text-sm font-medium text-[#9AA4B2] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="tracking-[0.15em] text-[#9AA4B2]">
          Day Trading University
        </span>
        <span className="title-font text-lg text-[#1F6FFF] sm:text-xl">
          Prop Firm Risk Calculator
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-3 py-1 text-xs uppercase tracking-[0.25em] text-white">
          DTU Tool
        </span>
      </header>

      <main className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="title-font text-2xl text-[#1F6FFF] sm:text-3xl">
              Configure your risk inputs
            </h2>
            <p className="mt-2 text-sm text-[#9AA4B2]">
              Plug in your firm limits, pick the contract, and we will align risk
              per trade with your stop size.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Profit Target ($)
              </label>
              <input
                type="number"
                min="0"
                value={profitTarget}
                onChange={(event: ValueChangeEvent) => {
                  setProfitTarget(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.profitTarget && (
                <p className="text-xs text-[#D94A4A]">
                  {errors.profitTarget}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Max Loss Limit ($)
              </label>
              <input
                type="number"
                min="0"
                value={maxLoss}
                onChange={(event: ValueChangeEvent) => {
                  setMaxLoss(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.maxLoss && (
                <p className="text-xs text-[#D94A4A]">{errors.maxLoss}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Max Contract Size
              </label>
              <input
                type="number"
                min="1"
                value={maxContractSize}
                onChange={(event: ValueChangeEvent) => {
                  setMaxContractSize(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.maxContractSize && (
                <p className="text-xs text-[#D94A4A]">
                  {errors.maxContractSize}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Daily Loss Limit ($)
              </label>
              <input
                type="number"
                min="0"
                value={dailyLossCap}
                onChange={(event: ValueChangeEvent) => {
                  setDailyLossCap(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.dailyLossCap && (
                <p className="text-xs text-[#D94A4A]">
                  {errors.dailyLossCap}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Trades until account is lost
              </label>
              <input
                type="number"
                min="1"
                value={tradesToBust}
                onChange={(event: ValueChangeEvent) => {
                  setTradesToBust(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.tradesToBust && (
                <p className="text-xs text-[#D94A4A]">
                  {errors.tradesToBust}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                Consistency Rule
              </label>
              <label className="flex items-center gap-2 text-sm text-[#9AA4B2]">
                <input
                  type="checkbox"
                  checked={applyConsistencyRule}
                  onChange={(event) => {
                    const nextValue = event.target.checked
                    setApplyConsistencyRule(nextValue)
                    if (!nextValue) {
                      setConsistencyRule('')
                    }
                    markInputsChanged()
                  }}
                  className="h-4 w-4 rounded border border-[#9AA4B2] text-[#1F6FFF] focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                Apply Consistency Rule
              </label>
              {applyConsistencyRule && (
                <input
                  type="number"
                  min="0"
                  value={consistencyRule}
                  onChange={(event: ValueChangeEvent) => {
                    setConsistencyRule(event.target.value)
                    markInputsChanged()
                  }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                What do you trade?
              </label>
              <select
                value={asset}
                onChange={(event: ValueChangeEvent) => {
                  setAsset(event.target.value as AssetKey)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              >
                {Object.keys(TICK_VALUES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
                <option value="Custom">Custom ($/tick)</option>
              </select>
            </div>

            {asset === 'Custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#9AA4B2]">
                  Tick Value ($/tick)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customTickValue}
                  onChange={(event: ValueChangeEvent) => {
                    setCustomTickValue(event.target.value)
                    markInputsChanged()
                  }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.tickValue && (
                  <p className="text-xs text-[#D94A4A]">
                    {errors.tickValue}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9AA4B2]">
                What size stop loss do you use? (in ticks)
              </label>
              <input
                type="number"
                min="0"
                value={stopTicks}
                onChange={(event: ValueChangeEvent) => {
                  setStopTicks(event.target.value)
                  markInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              {errors.stopTicks && (
                <p className="text-xs text-[#D94A4A]">{errors.stopTicks}</p>
              )}
            </div>

            {asset !== 'Custom' && (
              <div className="rounded-2xl border border-dashed border-[#9AA4B2] bg-white px-4 py-3 text-sm text-[#9AA4B2]">
                Tick Value:{' '}
                <span className="font-semibold text-[#1F6FFF]">
                  {tickValue}
                </span>{' '}
                $/tick
              </div>
            )}
          </div>

          {errors.tickValue && asset !== 'Custom' && (
            <p className="mt-3 text-xs text-[#D94A4A]">{errors.tickValue}</p>
          )}

          <button
            onClick={handleCalculate}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)]"
          >
            Calculate
          </button>
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="title-font text-2xl text-[#1F6FFF] sm:text-3xl">
              Risk outputs
            </h2>
            <p className="mt-2 text-sm text-[#9AA4B2]">
              Use these numbers to keep each trade aligned with your firm limits.
            </p>
          </div>

          {results ? (
            <div className="space-y-4 text-sm" aria-disabled={isStale}>
              {isStale && (
                <p className="text-xs text-[#D94A4A]">
                  Inputs changed - press Calculate.
                </p>
              )}
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                  Risk per trade
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#1F6FFF]">
                  {formatCurrency(results.riskPerTrade)}
                </p>
                <p className="mt-1 text-xs text-[#9AA4B2]">
                  {formatNumber(results.riskPerTradeTicks)} ticks per trade
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                  Risk per contract
                </p>
                <p className="mt-1 text-xl font-semibold text-[#1F6FFF]">
                  {formatCurrency(results.riskPerContract)}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                  Daily Profit Target
                </p>
                <p className="mt-1 text-xl font-semibold text-[#1F6FFF]">
                  {formatCurrency(results.dailyProfitThreshold ?? 0)}
                </p>
              </div>

              {showMaxDailyProfit && (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                    MAX Daily Profit
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#1F6FFF]">
                    {formatCurrency(maxDailyProfit)}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                  Suggested contracts
                </p>
                <p className="mt-1 text-3xl font-semibold text-[#1F6FFF]">
                  {results.suggestedContracts}
                </p>
                {showWarning && (
                  <p className="mt-2 text-xs font-semibold text-[#D94A4A]">
                    Suggested contracts is below 1. Increase max loss or reduce
                    stop size.
                  </p>
                )}
              </div>

              {results.maxTradesPerDay !== undefined && (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                    Daily loss cap insight
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1F6FFF]">
                    Max trades per day:{' '}
                    <span className="text-[#2ECC71]">
                      {results.maxTradesPerDay}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[#9AA4B2]">
                    Daily profit threshold:{' '}
                    <span className="font-semibold text-[#2ECC71]">
                      {formatCurrency(results.dailyProfitThreshold ?? 0)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#9AA4B2] bg-white px-4 py-8 text-center text-sm text-[#1F6FFF]">
              Enter inputs and press Calculate to see risk outputs.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
