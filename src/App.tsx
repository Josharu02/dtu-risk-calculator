
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
    <div className="min-h-screen px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <main className="mx-auto grid w-full grid-cols-1 gap-6">
        <div className="w-full lg:mx-auto lg:max-w-[1000px]">
          <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="title-font section-title text-2xl sm:text-3xl">
              Configure your risk inputs
            </h2>
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

          {currentStep < 7 ? (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#1F6FFF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)]"
              >
                Next
              </button>
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-between max-[480px]:flex-col max-[480px]:items-stretch max-[480px]:justify-start max-[480px]:gap-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#1F6FFF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60 max-[480px]:order-2 max-[480px]:w-full"
              >
                Back
              </button>
              <div className="flex items-center gap-3 max-[480px]:contents">
                <button
                  onClick={handleStartOver}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#1F6FFF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F6FFF] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.25)] max-[480px]:order-3 max-[480px]:w-full"
                >
                  Start Over
                </button>
                <button
                  onClick={handleCalculate}
                  type="button"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#1F6FFF] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[0_20px_60px_rgba(31,111,255,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(31,111,255,0.45)] max-[480px]:order-1 max-[480px]:w-full"
                >
                  CALCULATE
                </button>
              </div>
            </div>
          )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App




