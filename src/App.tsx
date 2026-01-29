import { useMemo, useState } from 'react'

const TICK_VALUE_PER_TICK = {
  ES: 12.5,
  MES: 1.25,
  NQ: 5,
  MNQ: 0.5,
  RTY: 5,
  M2K: 0.5,
  YM: 5,
  MYM: 0.5,
  NKD: 25,
  MBT: 0.5,
  MET: 0.05,
  '6A': 5,
  '6B': 6.25,
  '6C': 5,
  '6E': 6.25,
  '6J': 6.25,
  '6S': 6.25,
  E7: 6.35,
  M6E: 1.25,
  M6A: 1,
  '6M': 5,
  '6N': 5,
  M6B: 0.625,
  LE: 10,
  HE: 10,
  ZC: 12.5,
  ZW: 12.5,
  ZS: 12.5,
  ZM: 10,
  ZL: 6,
  CL: 10,
  QM: 12.5,
  NG: 10,
  QG: 12.5,
  MCL: 1,
  RB: 4.2,
  HO: 4.2,
  PL: 5,
  MNG: 1,
  ZT: 7.8125,
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

type AssetKey = keyof typeof TICK_VALUE_PER_TICK | 'Custom'

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
  suggestedContractsRaw: number
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

const SummaryCards = ({
  calculated,
  isFinalStep,
}: {
  calculated: CalculatedOutputs
  isFinalStep: boolean
}) => {
  const isCapped =
    calculated.suggestedContractsRaw > calculated.maxContractSize

  return (
    <div className={`text-sm ${isFinalStep ? 'space-y-3' : 'space-y-4'}`}>
      <div
        className={`rounded-2xl bg-white px-4 ${
          isFinalStep ? 'py-2.5' : 'py-3'
        }`}
      >
        <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
          Risk management
        </p>
        <p className="mt-2 text-sm body-text">
          Suggested Contracts:{' '}
          <span className="font-semibold text-[#1F6FFF]">
            {calculated.suggestedContracts}
          </span>
          {isCapped && (
            <span className="font-semibold text-[#1F6FFF]">
              {' '}
              (capped at {calculated.maxContractSize} max)
            </span>
          )}
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
          contracts. This means you&apos;d be risking{' '}
          {formatCurrency(calculated.riskPerTrade ?? 0)} per trade. With a Daily
          Loss Limit of{' '}
          <span className="font-semibold text-[#D94A4A]">
            {formatCurrency(calculated.dailyLossLimit ?? 0)}
          </span>
          , you could take {calculated.maxSlHitsPerDay ?? 0} full stop loss hits
          before stopping for the day.
        </p>
      </div>

    {(!calculated.consistencyEnabled || calculated.maxDailyProfit > 0) && (
      <div
        className={`rounded-2xl bg-white px-4 ${
          isFinalStep ? 'py-2.5' : 'py-3'
        }`}
      >
        <p className="helper-text uppercase font-semibold tracking-[0.05em] text-[#111827]">
          Profit goals
        </p>
        {!calculated.consistencyEnabled && (
          <p className="mt-2 text-sm body-text">
            Your daily profit target is{' '}
            <span className="font-semibold text-[#2ECC71]">
              {formatCurrency(calculated.dailyProfitTarget ?? 0)}
            </span>{' '}
            and you don&apos;t have a consistency rule, so anything above
            that is just extra!
          </p>
        )}
        {calculated.consistencyEnabled && calculated.maxDailyProfit > 0 && (
          <p className="mt-2 text-sm body-text">
            Your daily profit target is{' '}
            <span className="font-semibold text-[#2ECC71]">
              {formatCurrency(calculated.dailyProfitTarget ?? 0)}
            </span>{' '}
            and since you have a consistency rule, make sure you don&apos;t
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
  )
}

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
  const [currentStep, setCurrentStep] = useState(0)
  const [calculated, setCalculated] = useState<CalculatedOutputs | null>(null)
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'success' | 'error' | 'info'
  >('idle')
  const [emailError, setEmailError] = useState('')
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const maxContractSizeValue = Number(maxContractSize)
  const tickValue = useMemo(() => {
    if (asset === 'Custom') {
      return Number(customTickValue)
    }
    return TICK_VALUE_PER_TICK[asset] ?? 0
  }, [asset, customTickValue])

  const markCalculatorInputsChanged = () => {
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

    if (asset !== 'Custom' && !(asset in TICK_VALUE_PER_TICK)) {
      nextErrors.tickValue = 'Tick value is missing for the selected product.'
    } else if (!Number.isFinite(tickValue) || tickValue <= 0) {
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
      const firstErrorStep = (
        [
          ['profitTarget', 0],
          ['maxLoss', 1],
          ['maxContractSize', 2],
          ['dailyLossCap', 3],
          ['tradesToBust', 4],
          ['consistencyRule', 5],
          ['tickValue', 6],
          ['stopTicks', 7],
        ] as const
      ).find(([key]) => Boolean(nextErrors[key]))?.[1]
      if (firstErrorStep !== undefined) {
        setCurrentStep(firstErrorStep)
      }
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
      return
    }

    const tradesUntilLostValue = Number(tradesUntilLost)
    const riskPerTrade = maxLossValue / tradesUntilLostValue
    const perContractRisk = stopTicksValue * tickValue
    const rawSuggested = riskPerTrade / perContractRisk
    const suggested = Math.max(1, Math.floor(rawSuggested))
    const suggestedCapped = Math.min(capValue, suggested)

    console.log('SUGGESTED_DEBUG', {
      profitTarget,
      tradesUntilLost,
      profitTargetValue,
      tradesUntilLostValue,
      rawSuggested,
      suggested,
      suggestedCapped,
    })
    const hasValidConsistencyRule =
      applyConsistencyRule &&
      Number.isFinite(consistencyRuleValue) &&
      consistencyRuleValue > 0
    const maxDailyProfitValue = hasValidConsistencyRule
      ? profitTargetValue * (consistencyRuleValue / 100)
      : 0

    if (dailyLossCapValue > 0 && riskPerTrade > dailyLossCapValue) {
      setErrors({
        dailyLossCap:
          'This is too much risk based on your Daily Loss Limit. You can either raise the DLL or increase the amount of trades taken until account is lost.',
      })
      setCurrentStep(3)
      return
    }

    const computedOutputs: CalculatedOutputs = {
      product: asset,
      stopLossTicks: stopTicksValue,
      suggestedContracts: suggestedCapped,
      suggestedContractsRaw: suggested,
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
    setCalculated(computedOutputs)
    console.log("CALCULATE_SET_CALCULATED", computedOutputs)
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
        if (asset !== 'Custom' && !(asset in TICK_VALUE_PER_TICK)) {
          nextErrors.tickValue =
            'Tick value is missing for the selected product.'
        } else if (!Number.isFinite(tickValue) || tickValue <= 0) {
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
    setCalculated(null)
    setFullName('')
    setEmail('')
    setConsentEmail(false)
    setEmailStatus('idle')
    setEmailError('')
    setIsEmailSubmitting(false)
    setErrors({})
  }

  const handleEmailSubmit = async () => {
    console.log('EMAIL_CLICKED')
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
      suggested_contracts_raw: calculated.suggestedContractsRaw,
      suggested_contracts_summary:
        calculated.suggestedContractsRaw > calculated.maxContractSize
          ? `Suggested Contracts: ${calculated.suggestedContractsRaw} (capped at ${calculated.maxContractSize} max)`
          : `Suggested Contracts: ${calculated.suggestedContractsRaw}`,
      risk_per_trade: calculated.riskPerTrade,
      max_sl_hits_per_day: calculated.maxSlHitsPerDay ?? 0,
      daily_profit_target: calculated.dailyProfitTarget ?? 0,
      max_daily_profit: calculated.consistencyEnabled
        ? calculated.maxDailyProfit
        : 0,
    }

    const requestUrl = 'https://dtu-risk-calculator-api.onrender.com/email-plan'
    console.log('EMAIL_REQUEST_URL', requestUrl)
    console.log('EMAIL_PAYLOAD', payload)
    console.log('EMAIL_START_TS', performance.now())

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      console.log('EMAIL_ABORTED_AFTER_MS', 45000)
      controller.abort()
    }, 45000)

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      console.log('EMAIL_RESPONSE_STATUS', response.status)
      const responseBody = await response.text()
      let data: unknown = null
      try {
        data = responseBody ? JSON.parse(responseBody) : null
      } catch (error) {
        if (error) {
          data = null
        }
      }
      console.log('EMAIL_RESPONSE_BODY', data)
      console.log('EMAIL_END_TS', performance.now())

      if (!response.ok) {
        let message = 'Unable to email the plan. Please try again.'
        try {
          if (data && typeof data === 'object' && 'message' in data) {
            message = String((data as { message?: unknown }).message ?? message)
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
      console.log('EMAIL_ERROR', error)
      console.log('EMAIL_END_TS', performance.now())
      const isAbort =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : Boolean(
              error &&
                typeof error === 'object' &&
                'name' in error &&
                (error as { name?: unknown }).name === 'AbortError',
            ) ||
            (error instanceof Error &&
              error.message.toLowerCase().includes('aborted'))
      if (isAbort) {
        setEmailError(
          'Email is processing — if you don’t see it in 1–2 minutes, check spam and try again.',
        )
        setEmailStatus('info')
        return
      }
      setEmailError('Unable to email the plan. Please try again.')
      setEmailStatus('error')
    } finally {
      clearTimeout(timeoutId)
      setIsEmailSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <main className="mx-auto grid w-full grid-cols-1 gap-6">
        <div className="text-center">
          <h1 className="title-font text-3xl text-[#1F6FFF] sm:text-4xl">
            Prop Firm Risk Calculator
          </h1>
          <p className="mt-2 text-sm font-medium text-white">
            Build a risk plan that aligns your trades with firm limits.
          </p>
        </div>
        <div className="w-full lg:mx-auto lg:max-w-[1000px]">
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
                  {Object.keys(TICK_VALUE_PER_TICK).map((key) => (
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

          {currentStep === 7 && calculated !== null && (
            <div
              className={`${
                currentStep === 7 ? 'mt-8 space-y-4' : 'mt-10 space-y-6'
              }`}
            >
              <SummaryCards
                calculated={calculated}
                isFinalStep={currentStep === 7}
              />
              <div
                className={`rounded-2xl border border-[#9AA4B2] bg-white px-4 ${
                  currentStep === 7 ? 'py-3' : 'py-4'
                }`}
              >
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
                  {emailStatus === 'success' && (
                    <p className="text-xs text-[#2ECC71]">
                      Your trading plan has been emailed to you.
                    </p>
                  )}
                  {emailStatus === 'error' && (
                    <p className="text-xs text-[#D94A4A]">{emailError}</p>
                  )}
                  {emailStatus === 'info' && (
                    <p className="text-xs text-[#9AA4B2]">{emailError}</p>
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
            </div>
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
          </section>
        </div>
      </main>
    </div>
  )
}

export default App




