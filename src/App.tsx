import { useMemo, useRef, useState } from 'react'

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
    | 'tickValue'
    | 'consistencyRule',
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
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [consentEmail, setConsentEmail] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [results, setResults] = useState<Results | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const [emailErrorMessage, setEmailErrorMessage] = useState('')
  const [emailFieldError, setEmailFieldError] = useState('')
  const emailFormRef = useRef<HTMLFormElement | null>(null)

  const tickValue = useMemo(() => {
    if (asset === 'Custom') {
      return Number(customTickValue)
    }
    return TICK_VALUES[asset]
  }, [asset, customTickValue])

  const markCalculatorInputsChanged = () => {
    if (results) {
      setIsStale(true)
    }
    if (hasCalculated) {
      setHasCalculated(false)
    }
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
    if (emailStatus !== 'idle') {
      setEmailStatus('idle')
    }
    if (emailErrorMessage) {
      setEmailErrorMessage('')
    }
    if (emailFieldError) {
      setEmailFieldError('')
    }
  }

  const markEmailInputsChanged = () => {
    if (emailStatus !== 'idle') {
      setEmailStatus('idle')
    }
    if (emailErrorMessage) {
      setEmailErrorMessage('')
    }
    if (emailFieldError) {
      setEmailFieldError('')
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

    const riskPerTrade = profitTargetValue / tradesToBustValue
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
          'This is too much risk based on your Daily Loss Limit. You can either raise the DLL or increase the amount of trades taken until account is lost.',
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
    setHasCalculated(true)
  }

  const validateStep = (stepIndex: number) => {
    const nextErrors: Errors = {}
    const maxContractSizeValue = Number(maxContractSize)
    const maxLossValue = Number(maxLoss)
    const profitTargetValue = Number(profitTarget)
    const tradesToBustValue = Number(tradesToBust)
    const stopTicksValue = Number(stopTicks)
    const dailyLossCapValue = Number(dailyLossCap)
    const consistencyRuleValue = Number(consistencyRule)

    switch (stepIndex) {
      case 0:
        if (profitTarget.trim() === '') {
          nextErrors.profitTarget = 'Profit Target is required.'
        } else if (
          !Number.isFinite(profitTargetValue) ||
          profitTargetValue <= 0
        ) {
          nextErrors.profitTarget = 'Profit Target must be greater than 0.'
        }
        break
      case 1:
        if (!Number.isFinite(maxLossValue) || maxLossValue <= 0) {
          nextErrors.maxLoss = 'Max loss must be greater than 0.'
        }
        break
      case 2:
        if (!Number.isFinite(maxContractSizeValue) || maxContractSizeValue < 1) {
          nextErrors.maxContractSize = 'Enter a whole number of at least 1.'
        }
        break
      case 3:
        if (dailyLossCap.trim() === '') {
          nextErrors.dailyLossCap =
            "Even if the prop firm doesn't have a Daily Loss Limit, you should still have one as part of your trading plan."
        } else if (
          !Number.isFinite(dailyLossCapValue) ||
          dailyLossCapValue <= 0
        ) {
          nextErrors.dailyLossCap = 'Daily loss limit must be greater than 0.'
        }
        break
      case 4:
        if (tradesToBust.trim() === '') {
          nextErrors.tradesToBust = 'Trades until account is lost is required.'
        } else if (
          !Number.isFinite(tradesToBustValue) ||
          tradesToBustValue < 1
        ) {
          nextErrors.tradesToBust =
            'Trades until account is lost must be at least 1.'
        }
        break
      case 5:
        if (applyConsistencyRule) {
          if (consistencyRule.trim() === '') {
            nextErrors.consistencyRule =
              'Consistency rule percentage is required.'
          } else if (
            !Number.isFinite(consistencyRuleValue) ||
            consistencyRuleValue <= 0
          ) {
            nextErrors.consistencyRule =
              'Consistency rule percentage must be greater than 0.'
          }
        }
        break
      case 6:
        if (!Number.isFinite(tickValue) || tickValue <= 0) {
          nextErrors.tickValue = 'Tick value must be greater than 0.'
        }
        break
      case 7:
        if (!Number.isFinite(stopTicksValue) || stopTicksValue <= 0) {
          nextErrors.stopTicks = 'Stop loss size must be greater than 0.'
        }
        break
      default:
        break
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((step) => Math.min(step + 1, 7))
    }
  }

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const handleStartOver = () => {
    setCurrentStep(0)
    setErrors({})
    setIsStale(false)
    setHasCalculated(false)
  }

  const handleEmailSubmit = () => {
    if (!results) {
      return
    }

    if (email.trim() === '') {
      setEmailFieldError('Email is required.')
      return
    }

    if (!consentEmail) {
      setEmailFieldError('You must consent to receive the email.')
      return
    }

    setEmailFieldError('')
    setEmailErrorMessage('')

    if (emailFormRef.current) {
      emailFormRef.current.submit()
      setEmailStatus('success')
    } else {
      setEmailStatus('error')
      setEmailErrorMessage('Something went wrong. Please try again.')
    }
  }

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
  const dailyLossLimitValue = Number(dailyLossCap)

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

          <div className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
            Step {currentStep + 1} of 8
          </div>

          <div className="mt-5 space-y-5">
            {currentStep === 0 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.profitTarget && (
                  <p className="text-xs text-[#D94A4A]">
                    {errors.profitTarget}
                  </p>
                )}
              </div>
            )}

            {currentStep === 1 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.maxLoss && (
                  <p className="text-xs text-[#D94A4A]">{errors.maxLoss}</p>
                )}
              </div>
            )}

            {currentStep === 2 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.maxContractSize && (
                  <p className="text-xs text-[#D94A4A]">
                    {errors.maxContractSize}
                  </p>
                )}
              </div>
            )}

            {currentStep === 3 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.dailyLossCap && (
                  <p className="text-xs text-[#D94A4A]">
                    {errors.dailyLossCap}
                  </p>
                )}
              </div>
            )}

            {currentStep === 4 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.tradesToBust && (
                  <p className="text-xs text-[#D94A4A]">
                    {errors.tradesToBust}
                  </p>
                )}
              </div>
            )}

            {currentStep === 5 && (
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
                    markCalculatorInputsChanged()
                  }}
                    className="h-4 w-4 rounded border border-[#9AA4B2] text-[#1F6FFF] focus:ring-2 focus:ring-[#1F6FFF]/20"
                  />
                  Apply Consistency Rule
                </label>
                {applyConsistencyRule && (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={consistencyRule}
                      onChange={(event: ValueChangeEvent) => {
                        setConsistencyRule(event.target.value)
                        markCalculatorInputsChanged()
                      }}
                      className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                    />
                    {errors.consistencyRule && (
                      <p className="text-xs text-[#D94A4A]">
                        {errors.consistencyRule}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#9AA4B2]">
                  What do you trade?
                </label>
                <select
                  value={asset}
                  onChange={(event: ValueChangeEvent) => {
                  setAsset(event.target.value as AssetKey)
                  markCalculatorInputsChanged()
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
                {asset === 'Custom' && (
                  <>
                    <label className="text-sm font-medium text-[#9AA4B2]">
                      Tick Value ($/tick)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customTickValue}
                      onChange={(event: ValueChangeEvent) => {
                        setCustomTickValue(event.target.value)
                        markCalculatorInputsChanged()
                      }}
                      className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                    />
                  </>
                )}
                {errors.tickValue && (
                  <p className="text-xs text-[#D94A4A]">{errors.tickValue}</p>
                )}
              </div>
            )}

            {currentStep === 7 && (
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
                  markCalculatorInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                {errors.stopTicks && (
                  <p className="text-xs text-[#D94A4A]">{errors.stopTicks}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            {currentStep < 7 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)]"
              >
                Next
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartOver}
                  className="inline-flex items-center justify-center rounded-full border border-[#1F6FFF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F6FFF] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.25)]"
                >
                  Start Over
                </button>
                <button
                  onClick={handleCalculate}
                  className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)]"
                >
                  Calculate
                </button>
              </div>
            )}
          </div>

          {currentStep === 7 && hasCalculated && (
            <div className="mt-8 rounded-2xl border border-[#9AA4B2] bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                Email my trading plan
              </p>
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(event: ValueChangeEvent) => {
                  setFullName(event.target.value)
                  markEmailInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event: ValueChangeEvent) => {
                  setEmail(event.target.value)
                  markEmailInputsChanged()
                }}
                  className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                <label className="flex items-center gap-2 text-sm text-[#9AA4B2]">
                  <input
                    type="checkbox"
                    checked={consentEmail}
                    onChange={(event) => {
                    setConsentEmail(event.target.checked)
                    markEmailInputsChanged()
                  }}
                    className="h-4 w-4 rounded border border-[#9AA4B2] text-[#1F6FFF] focus:ring-2 focus:ring-[#1F6FFF]/20"
                  />
                  I consent to receive my trading plan by email.
                </label>
                {emailFieldError && (
                  <p className="text-xs text-[#D94A4A]">{emailFieldError}</p>
                )}
                {emailStatus === 'success' && (
                  <p className="text-xs text-[#2ECC71]">
                    Your trading plan has been emailed to you.
                  </p>
                )}
                {emailStatus === 'error' && (
                  <p className="text-xs text-[#D94A4A]">
                    {emailErrorMessage}
                  </p>
                )}
              <button
                onClick={handleEmailSubmit}
                disabled={!results || emailStatus === 'success'}
                className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Email My Trading Plan
              </button>
            </div>
          </div>
        )}

        {currentStep === 7 && hasCalculated && results && (
          <>
            <iframe
              title="GHL Submit"
              name="ghl_target"
              className="hidden"
            />
            <form
              ref={emailFormRef}
              method="POST"
              action="https://api.leadconnectorhq.com/widget/form/M64bV1aWnQ1v4q7T"
              target="ghl_target"
              className="hidden"
            >
              <input type="hidden" name="full_name" value={fullName.trim()} />
              <input type="hidden" name="email" value={email.trim()} />
              <input
                type="hidden"
                name="profit_target"
                value={String(Number(profitTarget))}
              />
              <input
                type="hidden"
                name="max_loss_limit"
                value={String(Number(maxLoss))}
              />
              <input
                type="hidden"
                name="max_contract_size"
                value={String(Number(maxContractSize))}
              />
              <input
                type="hidden"
                name="daily_loss_limit"
                value={String(Number(dailyLossCap))}
              />
              <input
                type="hidden"
                name="trades_until_lost"
                value={String(Number(tradesToBust))}
              />
              <input
                type="hidden"
                name="consistency_enabled"
                value={applyConsistencyRule ? 'true' : 'false'}
              />
              <input
                type="hidden"
                name="consistency_rule"
                value={applyConsistencyRule ? consistencyRule.trim() : ''}
              />
              <input type="hidden" name="product" value={asset} />
              <input
                type="hidden"
                name="stop_loss_ticks"
                value={String(Number(stopTicks))}
              />
              <input
                type="hidden"
                name="suggested_contracts"
                value={String(results.suggestedContracts)}
              />
              <input
                type="hidden"
                name="risk_per_trade"
                value={String(results.riskPerTrade)}
              />
              <input
                type="hidden"
                name="max_sl_hits_per_day"
                value={String(
                  Math.floor(Number(dailyLossCap) / results.riskPerTrade),
                )}
              />
              <input
                type="hidden"
                name="daily_profit_target"
                value={String(results.dailyProfitThreshold ?? 0)}
              />
              <input
                type="hidden"
                name="max_daily_profit"
                value={applyConsistencyRule ? String(maxDailyProfit) : '0'}
              />
            </form>
          </>
        )}
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
                  Risk management
                </p>
                <p className="mt-2 text-sm text-[#9AA4B2]">
                  Since you trade <span className="font-semibold text-[#1F6FFF]">{asset}</span> and you normally use a <span className="font-semibold text-[#1F6FFF]">{stopTicks}</span>{' '}
                  tick stop loss, you should be using{' '}
                  <span className="font-semibold text-[#1F6FFF]">{results.suggestedContracts}</span> contracts. This means you’d be
                  risking {formatCurrency(results.riskPerTrade)} per trade. With
                  a Daily Loss Limit of <span className="font-semibold text-[#D94A4A]">{formatCurrency(dailyLossLimitValue)}</span>,
                  you could take{' '}
                  {Math.floor(dailyLossLimitValue / results.riskPerTrade)} full
                  stop loss hits before stopping for the day.
                </p>
              </div>

              {(!applyConsistencyRule || showMaxDailyProfit) && (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4B2]">
                    Profit goals
                  </p>
                  {!applyConsistencyRule && (
                    <p className="mt-2 text-sm text-[#9AA4B2]">
                      Your daily profit target is{' '}
                      <span className="font-semibold text-[#2ECC71]">{formatCurrency(results.dailyProfitThreshold ?? 0)}</span> and
                      you don’t have a consistency rule, so anything above that
                      is just extra!
                    </p>
                  )}
                  {showMaxDailyProfit && (
                    <p className="mt-2 text-sm text-[#9AA4B2]">
                      Your daily profit target is{' '}
                      <span className="font-semibold text-[#2ECC71]">{formatCurrency(results.dailyProfitThreshold ?? 0)}</span> and
                      since you have a consistency rule, make sure you don’t
                      make any more than <span className="font-semibold text-[#2ECC71]">{formatCurrency(maxDailyProfit)}</span> in a
                      single trading day.
                    </p>
                  )}
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
