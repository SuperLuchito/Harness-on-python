import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { PROVIDER_ORDER, PROVIDERS } from '../data/providers';
import { ProviderId } from '../types/guide';

interface ProviderSelectorProps {
  selectedProvider: ProviderId;
  selectedModel: string;
  onSelectProvider: (id: ProviderId) => void;
  onSelectModel: (modelId: string) => void;
}

export function ProviderSelector({
  selectedProvider,
  selectedModel,
  onSelectProvider,
  onSelectModel,
}: ProviderSelectorProps) {
  const current = PROVIDERS[selectedProvider];

  return (
    <section
      id="provider-setup"
      aria-labelledby="provider-setup-heading"
      className="my-10 scroll-mt-24 rounded-[8px] border border-[#e0e2dc] bg-[#fcfcf9] p-5 shadow-[0_2px_12px_rgba(17,22,20,0.035)] sm:p-6 dark:border-white/[0.1] dark:bg-[#171a19]"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
          ПРОВАЙДЕР // НАСТРОЙКА КОДА
        </p>
        <p className="font-mono text-[11px] text-[#61655f] dark:text-[#8e938c]">
          весь код ниже перестраивается сразу
        </p>
      </div>

      <h2
        id="provider-setup-heading"
        className="mt-2 text-[22px] font-medium tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]"
      >
        Выбери провайдера перед стартом
      </h2>

      <p className="mt-2 text-[15px] leading-[1.6] text-[#2e322f] dark:text-[#c7cac3]">
        Я вынес подключение к API в отдельный небольшой файл{' '}
        <code className="amp-inline-code">provider.py</code>. Поэтому можно подключить подписку{' '}
        <strong className="font-medium text-[#111614] dark:text-[#ecece6]">Command Code GOAT</strong>,
        поднять свой прокси с квотами для команды или учеников, либо вставить прямой API-ключ — и
        переключать провайдера в любой момент без правок самого агента.
      </p>

      {/* Provider switcher cards with refined sage-emerald active state & animated checkmark */}
      <div
        role="tablist"
        aria-label="Выбор провайдера LLM"
        className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PROVIDER_ORDER.map((id) => {
          const item = PROVIDERS[id];
          const isActive = id === selectedProvider;
          return (
            <motion.button
              key={id}
              type="button"
              role="tab"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              aria-selected={isActive}
              onClick={() => onSelectProvider(id)}
              className={`group relative flex flex-col items-start rounded-[6px] border px-3.5 py-2.5 text-left transition-all duration-200 ${
                isActive
                  ? 'border-[#2e7d5b]/70 bg-[#2e7d5b]/[0.08] text-[#111614] shadow-[0_2px_10px_rgba(46,125,91,0.12)] dark:border-[#4cb888]/65 dark:bg-[#4cb888]/[0.12] dark:text-[#f0f4f1] dark:shadow-[0_2px_12px_rgba(76,184,136,0.14)]'
                  : 'border-[#e2e3dd] bg-[#f7f7f3]/80 text-[#2e322f] hover:border-[#2e7d5b]/40 hover:bg-white dark:border-white/10 dark:bg-[#121413]/75 dark:text-[#c7cac3] dark:hover:border-[#4cb888]/40 dark:hover:bg-[#191d1b]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="provider-active-bar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#2e7d5b] dark:bg-[#4cb888]"
                />
              )}
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[13px] font-medium leading-snug">{item.shortName}</span>
                <AnimatePresence mode="wait" initial={false}>
                  {isActive ? (
                    <motion.span
                      key="checked"
                      initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#2e7d5b] text-white shadow-[0_1px_4px_rgba(46,125,91,0.35)] dark:bg-[#4cb888] dark:text-[#0f1714]"
                    >
                      <Check className="h-3 w-3 stroke-[2.6]" aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <span
                      key="unchecked"
                      className="inline-block h-[18px] w-[18px] shrink-0 rounded-full border border-[#d2d5cd] transition-colors group-hover:border-[#2e7d5b]/50 dark:border-white/15 dark:group-hover:border-[#4cb888]/50"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span
                className={`mt-1 font-mono text-[10.5px] ${
                  isActive
                    ? 'text-[#246348] dark:text-[#84d9b2]'
                    : 'text-[#61655f] dark:text-[#8e938c]'
                }`}
              >
                {item.authLabel}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Active provider technical specs with smooth transition */}
      <div className="mt-5 border-t border-[#e8e9e3] pt-5 dark:border-white/[0.08]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedProvider}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-[15px] font-medium text-[#111614] dark:text-[#ecece6]">
              {current.title}
            </h3>
            <p className="mt-1 text-[14px] leading-[1.58] text-[#3a3e3b] dark:text-[#b9bdb6]">
              {current.setupSummary}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 font-mono text-[12px]">
              <div className="rounded-[5px] border border-[#e6e7e1] bg-[#f7f7f3] px-3 py-2.5 dark:border-white/[0.07] dark:bg-[#121413]">
                <div className="text-[10px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                  BASE_URL
                </div>
                <div className="mt-1 break-all text-[#111614] dark:text-[#ecece6]">
                  {current.baseUrl ?? 'Нативный адрес SDK Anthropic'}
                </div>
              </div>

              <div className="rounded-[5px] border border-[#e6e7e1] bg-[#f7f7f3] px-3 py-2.5 dark:border-white/[0.07] dark:bg-[#121413]">
                <div className="text-[10px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                  ПЕРЕМЕННАЯ ОКРУЖЕНИЯ
                </div>
                <div className="mt-1 text-[#2e7d5b] dark:text-[#58c494]">{current.envVar}</div>
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-[1.55] text-[#4e524d] dark:text-[#a6aaa3]">
              <span className="font-medium text-[#111614] dark:text-[#ecece6]">Где взять ключ: </span>
              {current.keyHowTo}
            </p>

            {/* Model selector with pleasant tactile active checkmark */}
            <div className="mt-4">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                МОДЕЛЬ В ПРИМЕРАХ КОДА
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {current.models.map((m) => {
                  const active = selectedModel === m.id;
                  return (
                    <motion.button
                      key={m.id}
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      onClick={() => onSelectModel(m.id)}
                      aria-pressed={active}
                      className={`group rounded-[6px] border px-3 py-2.5 text-left transition-all duration-150 ${
                        active
                          ? 'border-[#2e7d5b]/65 bg-[#2e7d5b]/[0.07] shadow-[0_1px_8px_rgba(46,125,91,0.1)] dark:border-[#4cb888]/65 dark:bg-[#4cb888]/[0.12]'
                          : 'border-[#e4e5df] bg-[#f7f7f3]/70 hover:border-[#2e7d5b]/40 hover:bg-white dark:border-white/[0.08] dark:bg-[#121413]/70 dark:hover:border-[#4cb888]/40 dark:hover:bg-[#1a1f1d]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                              active
                                ? 'bg-[#2e7d5b] text-white dark:bg-[#4cb888] dark:text-[#0f1714]'
                                : 'border border-[#cfd2ca] dark:border-white/15'
                            }`}
                          >
                            {active && (
                              <motion.span
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                              >
                                <Check className="h-2.5 w-2.5 stroke-[2.8]" aria-hidden="true" />
                              </motion.span>
                            )}
                          </span>
                          <span className="truncate text-[13px] font-medium text-[#111614] dark:text-[#ecece6]">
                            {m.label}
                          </span>
                        </div>
                        <span className="shrink-0 truncate max-w-[140px] font-mono text-[10.5px] text-[#61655f] dark:text-[#8e938c]">
                          {m.id}
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11.5px] leading-snug text-[#575b55] dark:text-[#989d95]">
                        {m.note}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {(selectedProvider === 'command_code_goat' || selectedProvider === 'goat_shared_proxy') && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                <a
                  href="#goat-proxy"
                  className="amp-prose-link inline-flex items-center gap-1.5 text-[13.5px]"
                >
                  <span>Как раздавать лимиты подписки GOAT другим через прокси</span>
                  <ArrowRight className="h-3.5 w-3.5 not-italic" aria-hidden="true" />
                </a>
                <a
                  href="#locals"
                  className="amp-prose-link inline-flex items-center gap-1.5 text-[13.5px] text-[#246348] dark:text-[#7edcb0]"
                >
                  <span>Или запустить локально через Locals (Apple Silicon)</span>
                  <ArrowRight className="h-3.5 w-3.5 not-italic" aria-hidden="true" />
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
