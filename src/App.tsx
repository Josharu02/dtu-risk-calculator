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
    | 'tickValue'
    | 'consistencyRule',
    string
  >
>

type CalculatedOutputs = {
  product: AssetKey
  stopLossTicks: number
  suggestedContracts: number
  profitTarget: number
  maxContractSize: number
  tradesUntilLost: number
  riskPerTrade: number
  maxLossLimit: number
  dailyLossLimit: number
  dailyProfitTarget: number
  maxSlHitsPerDay: number
  consistencyEnabled: boolean
  maxDailyProfit: number
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
  const [isStale, setIsStale] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [calculated, setCalculated] = useState<CalculatedOutputs | null>(null)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const [emailError, setEmailError] = useState('')
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const isFinalStep = currentStep === 7

  const maxContractSizeValue = Number(maxContractSize)
  const tickValue = useMemo(() => {
    if (asset === 'Custom') {
      return Number(customTickValue)
    }
    return TICK_VALUES[asset]
  }, [asset, customTickValue])

  const markCalculatorInputsChanged = () => {
    if (calculated) {
      setIsStale(true)
    }
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
    if (emailStatus !== 'idle') {
      setEmailStatus('idle')
    }
  }

  const markEmailInputsChanged = () => {
    if (emailStatus !== 'idle') {
      setEmailStatus('idle')
    }
    if (emailError) {
      setEmailError('')
    }
  }

  const handleCalculate = (event?: React.SyntheticEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    console.log("CALCULATE_CLICKED")
    setIsStale(false)
    const nextErrors: Errors = {}
    const maxLossValue = Number(maxLoss)
    const profitTargetValue = Number(profitTarget)
    const tradesToBustValue = Number(tradesToBust)
    const stopTicksValue = Number(stopTicks)
    const dailyLossCapValue = Number(dailyLossCap)
    const consistencyRuleValue = Number(consistencyRule)

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
      setIsStale(false)
      return
    }

    const tradesUntilLost = tradesToBustValue
    const capValue = Number.isFinite(maxContractSizeValue)
      ? maxContractSizeValue
      : Number.POSITIVE_INFINITY

    if (!Number.isFinite(tradesUntilLost) || tradesUntilLost <= 0) {
      setErrors({
        tradesToBust:
          'Trades until account is lost must be at least 1.',
      })
      setIsStale(false)
      return
    }

    const riskPerTrade = profitTargetValue / tradesUntilLost
    const tradesUntilLostValue = Number(tradesUntilLost)
    const suggestedRaw =
      Number.isFinite(profitTargetValue) &&
      profitTargetValue > 0 &&
      Number.isFinite(tradesUntilLostValue) &&
      tradesUntilLostValue > 0
        ? profitTargetValue / tradesUntilLostValue
        : 0
    const suggestedRounded = Math.round(suggestedRaw)
    const suggestedContracts = suggestedRounded > 0 ? suggestedRounded : 0
    const suggestedCapped = Math.min(capValue, suggestedContracts)

    console.log('SUGGESTED_DEBUG', {
      profitTarget,
      tradesUntilLost,
      profitTargetValue,
      tradesUntilLostValue,
      suggestedRaw,
      suggestedRounded,
      suggestedContracts,
    })
    const maxDailyProfitValue = applyConsistencyRule
      ? profitTargetValue * (consistencyRuleValue / 100)
      : 0

    if (riskPerTrade > dailyLossCapValue) {
      setErrors({
        dailyLossCap:
          'This is too much risk based on your Daily Loss Limit. You can either raise the DLL or increase the amount of trades taken until account is lost.',
      })
      setIsStale(false)
      return
    }

    setErrors({})
    setIsStale(false)
    const nextCalculated: CalculatedOutputs = {
      product: asset,
      stopLossTicks: stopTicksValue,
      suggestedContracts: suggestedCapped,
      profitTarget: profitTargetValue,
      maxContractSize: maxContractSizeValue,
      tradesUntilLost: tradesUntilLostValue,
      riskPerTrade,
      maxLossLimit: maxLossValue,
      dailyLossLimit: dailyLossCapValue,
      dailyProfitTarget: dailyLossCapValue,
      maxSlHitsPerDay: Math.floor(dailyLossCapValue / riskPerTrade),
      consistencyEnabled: applyConsistencyRule,
      maxDailyProfit: maxDailyProfitValue,
    }
    setCalculated(nextCalculated)
    console.log("CALCULATED_READY", nextCalculated)
    console.log("CALCULATED_SET", nextCalculated)
    console.log("CALCULATE_DONE", {
      calculatedFlagValue: true,
      outputsPreview: nextCalculated,
    })
  }

  const validateStep = (stepIndex: number) => {
    const nextErrors: Errors = {}
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
    setCalculated(null)
  }

  const handleEmailSubmit = async () => {
    if (isEmailSubmitting || !calculated) {
      setEmailError('Please calculate first.')
      setEmailStatus('error')
      return
    }

    if (!email.trim() || !consentEmail) {
      setEmailError('Enter your email and consent to receive the plan.')
      setEmailStatus('error')
      return
    }

    setEmailStatus('idle')
    setEmailError('')
    setIsEmailSubmitting(true)
    console.log("EMAIL_PAYLOAD_PREVIEW", calculated)
    console.log("EMAIL_SEND_ATTEMPT", {
      isFinalStep,
      hasCalculated: Boolean(calculated),
    })

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      consent: consentEmail,
      profit_target: calculated.profitTarget,
      max_loss_limit: calculated.maxLossLimit,
      max_contract_size: calculated.maxContractSize,
      daily_loss_limit: calculated.dailyLossLimit,
      trades_until_lost: calculated.tradesUntilLost,
      consistency_enabled: calculated.consistencyEnabled,
      consistency_rule: calculated.consistencyEnabled
        ? consistencyRule.trim()
        : '',
      product: calculated.product,
      stop_loss_ticks: calculated.stopLossTicks,
      suggested_contracts: calculated.suggestedContracts,
      risk_per_trade: calculated.riskPerTrade,
      max_sl_hits_per_day: calculated.maxSlHitsPerDay ?? 0,
      daily_profit_target: calculated.dailyProfitTarget ?? 0,
      max_daily_profit: calculated.consistencyEnabled
        ? calculated.maxDailyProfit
        : 0,
    }

    try {
      const response = await fetch(
        'https://dtu-risk-calculator-api.onrender.com/email-plan',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        let message = 'Unable to email the plan. Please try again.'
        try {
          const data = await response.json()
          if (data?.message) {
            message = data.message
          }
        } catch (error) {
          if (error) {
            message = 'Unable to email the plan. Please try again.'
          }
        }
        setEmailError(message)
        setEmailStatus('error')
        return
      }

      setEmailStatus('success')
    } catch (error) {
      if (error) {
        setEmailError('Unable to email the plan. Please try again.')
      }
      setEmailStatus('error')
    } finally {
      setIsEmailSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <header className="glass-panel mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl px-6 py-4 text-sm font-medium body-text sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="tracking-[0.15em] body-text">
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
            <h2 className="title-font section-title text-2xl sm:text-3xl">
              Configure your risk inputs
            </h2>
            <p className="mt-2 text-sm body-text">
              Plug in your firm limits, pick the contract, and we will align risk
              per trade with your stop size.
            </p>
          </div>

          {calculated ? (
            <div className="mt-5 space-y-4 text-sm">
              <div className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                Results
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                  Risk management
                </p>
                <p className="mt-2 text-sm body-text">
                  Since you trade{' '}
                  <span className="font-semibold text-[#1F6FFF]">
                    {calculated.product}
                  </span>{' '}
                  and you normally use a{' '}
                  <span className="font-semibold text-[#1F6FFF]">
                    {calculated.stopLossTicks}
                  </span>{' '}
                  tick stop loss, you should be using{' '}
                  <span className="font-semibold text-[#1F6FFF]">
                    {calculated.suggestedContracts ?? 0}
                  </span>{' '}
                  contracts. This means youÃ¢â‚¬â„¢d be risking{' '}
                  {formatCurrency(calculated.riskPerTrade ?? 0)} per trade. With
                  a Daily Loss Limit of{' '}
                  <span className="font-semibold text-[#D94A4A]">
                    {formatCurrency(calculated.dailyLossLimit ?? 0)}
                  </span>
                  , you could take{' '}
                  {calculated.maxSlHitsPerDay ?? 0}{' '}
                  full stop loss hits before stopping for the day.
                </p>
              </div>

              {(!calculated.consistencyEnabled ||
                calculated.maxDailyProfit > 0) && (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                    Profit goals
                  </p>
                  {!calculated.consistencyEnabled && (
                    <p className="mt-2 text-sm body-text">
                      Your daily profit target is{' '}
                      <span className="font-semibold text-[#2ECC71]">
                        {formatCurrency(calculated.dailyProfitTarget ?? 0)}
                      </span>{' '}
                      and you donÃ¢â‚¬â„¢t have a consistency rule, so anything
                      above that is just extra!
                    </p>
                  )}
                  {calculated.consistencyEnabled &&
                    calculated.maxDailyProfit > 0 && (
                    <p className="mt-2 text-sm body-text">
                      Your daily profit target is{' '}
                      <span className="font-semibold text-[#2ECC71]">
                        {formatCurrency(calculated.dailyProfitTarget ?? 0)}
                      </span>{' '}
                      and since you have a consistency rule, make sure you donÃ¢â‚¬â„¢t
                      make any more than{' '}
                      <span className="font-semibold text-[#2ECC71]">
                        {formatCurrency(calculated.maxDailyProfit ?? 0)}
                      </span>{' '}
                      in a single trading day.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                Step {currentStep + 1} of 8
              </div>

              <div className="mt-5 space-y-5">
                {currentStep === 0 && (
                  <div className="space-y-2">
                    <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
                      Consistency Rule
                    </label>
                    <label className="flex items-center gap-2 text-sm label-text">
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
                    <label className="text-sm label-text">
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
                        <label className="text-sm label-text">
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
                    <label className="text-sm label-text">
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
            </>
          )}

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
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)]"
                >
                  CALCULATE
                </button>
              </div>
            )}
          </div>

          {isFinalStep && (
          <div className="mt-10 rounded-2xl border border-[#9AA4B2] bg-white px-4 py-4">
            <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
              Email my trading plan
            </p>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                name="full_name"
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
                name="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(event: ValueChangeEvent) => {
                  setEmail(event.target.value)
                  markEmailInputsChanged()
                }}
                className="w-full rounded-xl border border-[#9AA4B2] bg-white px-4 py-3 text-base text-[#1F6FFF] shadow-sm focus:border-[#1F6FFF] focus:outline-none focus:ring-2 focus:ring-[#1F6FFF]/20"
              />
              <label className="flex items-center gap-2 text-sm label-text">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={consentEmail}
                  onChange={(event) => {
                    setConsentEmail(event.target.checked)
                    markEmailInputsChanged()
                  }}
                  className="h-4 w-4 rounded border border-[#9AA4B2] text-[#1F6FFF] focus:ring-2 focus:ring-[#1F6FFF]/20"
                />
                I consent to receive my trading plan by email.
              </label>
              {calculated ? (
                <div className="rounded-xl border border-dashed border-[#9AA4B2] bg-white px-3 py-2 helper-text">
                  <div className="mb-2 uppercase tracking-[0.2em]">
                    Plan details
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div>
                      Product:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.product}
                      </span>
                    </div>
                    <div>
                      Stop loss:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.stopLossTicks} ticks
                      </span>
                    </div>
                    <div>
                      Suggested contracts:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.suggestedContracts}
                      </span>
                    </div>
                    <div>
                      Risk per trade:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(calculated.riskPerTrade)}
                      </span>
                    </div>
                    <div>
                      Profit target:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(calculated.profitTarget)}
                      </span>
                    </div>
                    <div>
                      Max loss limit:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(calculated.maxLossLimit)}
                      </span>
                    </div>
                    <div>
                      Max contract size:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.maxContractSize}
                      </span>
                    </div>
                    <div>
                      Daily loss limit:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(calculated.dailyLossLimit)}
                      </span>
                    </div>
                    <div>
                      Trades until lost:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.tradesUntilLost}
                      </span>
                    </div>
                    <div>
                      Consistency enabled:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.consistencyEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      Consistency rule:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.consistencyEnabled
                          ? `${consistencyRule || 0}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      Max SL hits/day:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {calculated.maxSlHitsPerDay}
                      </span>
                    </div>
                    <div>
                      Daily profit target:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(calculated.dailyProfitTarget)}
                      </span>
                    </div>
                    <div>
                      Max daily profit:{' '}
                      <span className="font-semibold text-[#1F6FFF]">
                        {formatCurrency(
                          calculated.consistencyEnabled
                            ? calculated.maxDailyProfit
                            : 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#D94A4A]">
                  Press Calculate to unlock email.
                </p>
              )}
              {emailStatus === 'success' && (
                <p className="text-xs text-[#2ECC71]">
                  Your trading plan has been emailed to you.
                </p>
              )}
              {emailStatus === 'error' && (
                <p className="text-xs text-[#D94A4A]">{emailError}</p>
              )}
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={!calculated || isEmailSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#1F6FFF] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEmailSubmitting ? 'Sending...' : 'Email My Trading Plan'}
              </button>
            </div>
          </div>
          )}

        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="title-font section-title text-2xl sm:text-3xl">
              Risk outputs
            </h2>
            <p className="mt-2 text-sm body-text">
              Use these numbers to keep each trade aligned with your firm limits.
            </p>
          </div>

          {calculated ? (
              <div className="space-y-4 text-sm" aria-disabled={isStale}>
                {isStale && (
                  <p className="text-xs text-[#D94A4A]">
                    Inputs changed - press Calculate.
                  </p>
                )}
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                    Risk management
                  </p>
                  <p className="mt-2 text-sm body-text">
                    Since you trade{' '}
                    <span className="font-semibold text-[#1F6FFF]">
                      {calculated.product}
                    </span>{' '}
                    and you normally use a{' '}
                    <span className="font-semibold text-[#1F6FFF]">
                      {calculated.stopLossTicks}
                    </span>{' '}
                    tick stop loss, you should be using{' '}
                    <span className="font-semibold text-[#1F6FFF]">
                      {calculated.suggestedContracts ?? 0}
                    </span>{' '}
                    contracts. This means youâ€™d be risking{' '}
                    {formatCurrency(calculated.riskPerTrade ?? 0)} per trade.
                    With a Daily Loss Limit of{' '}
                    <span className="font-semibold text-[#D94A4A]">
                      {formatCurrency(calculated.dailyLossLimit ?? 0)}
                    </span>
                    , you could take{' '}
                    {calculated.maxSlHitsPerDay ?? 0}{' '}
                    full stop loss hits before stopping for the day.
                  </p>
                </div>

                {(!calculated.consistencyEnabled ||
                  calculated.maxDailyProfit > 0) && (
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
                      Profit goals
                    </p>
                    {!calculated.consistencyEnabled && (
                      <p className="mt-2 text-sm body-text">
                        Your daily profit target is{' '}
                        <span className="font-semibold text-[#2ECC71]">
                          {formatCurrency(calculated.dailyProfitTarget ?? 0)}
                        </span>{' '}
                        and you donâ€™t have a consistency rule, so anything
                        above that is just extra!
                      </p>
                    )}
                    {calculated.consistencyEnabled &&
                      calculated.maxDailyProfit > 0 && (
                      <p className="mt-2 text-sm body-text">
                        Your daily profit target is{' '}
                        <span className="font-semibold text-[#2ECC71]">
                          {formatCurrency(calculated.dailyProfitTarget ?? 0)}
                        </span>{' '}
                        and since you have a consistency rule, make sure you donâ€™t
                        make any more than{' '}
                        <span className="font-semibold text-[#2ECC71]">
                          {formatCurrency(calculated.maxDailyProfit ?? 0)}
                        </span>{' '}
                        in a single trading day.
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




