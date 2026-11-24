import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { VirtualKeyEntry } from '../types/guide';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';

interface GoatProxySectionProps {
  virtualKeys: VirtualKeyEntry[];
  goatProxyCode: string;
  syntaxHintsEnabled: boolean;
  activeFunctionId: string | null;
  onAddKey: (label: string, token: string, dailyLimit: number) => void;
  onRemoveKey: (id: string) => void;
  onUpdateLimit: (id: string, dailyLimit: number) => void;
  onSelectFunction: (fnId: string) => void;
  onOpenGlossaryWithSyntax: (syntaxId: string) => void;
  onSwitchToProxyProvider: () => void;
}

export function GoatProxySection({
  virtualKeys,
  goatProxyCode,
  syntaxHintsEnabled,
  activeFunctionId,
  onAddKey,
  onRemoveKey,
  onUpdateLimit,
  onSelectFunction,
  onOpenGlossaryWithSyntax,
  onSwitchToProxyProvider,
}: GoatProxySectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newLimit, setNewLimit] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newLabel.trim();
    const cleanToken = newToken.trim().replace(/\s+/g, '_');
    const parsedLimit = Number.parseInt(newLimit, 10);

    if (!cleanLabel) {
      setFormError('Укажи имя ученика или команды.');
      return;
    }
    if (!cleanToken || cleanToken.length < 4) {
      setFormError('Виртуальный ключ должен содержать минимум 4 символа.');
      return;
    }
    if (virtualKeys.some((k) => k.token === cleanToken)) {
      setFormError('Такой виртуальный ключ уже есть в списке.');
      return;
    }
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 5000) {
      setFormError('Укажи дневной лимит от 1 до 5000 запросов.');
      return;
    }

    setFormError(null);
    onAddKey(cleanLabel, cleanToken, parsedLimit);
    setNewLabel('');
    setNewToken('');
    setNewLimit('30');
  };

  return (
    <section
      id="goat-proxy"
      aria-labelledby="goat-proxy-heading"
      className="scroll-mt-24 border-t border-[#e4e5df] pt-12 dark:border-white/[0.08]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
        ДОПОЛНЕНИЕ // КОННЕКТОР ПОДПИСКИ
      </p>
      <h2
        id="goat-proxy-heading"
        className="mt-2 text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]"
      >
        Подписка Command Code GOAT и раздача лимитов через прокси
      </h2>

      <div className="mt-4 space-y-4 text-[16px] leading-[1.6] text-[#111614]/82 dark:text-[#ecece6]/82">
        <p>
          У тарифа <strong className="font-medium text-[#111614] dark:text-[#ecece6]">Command Code GOAT</strong>{' '}
          ($10/месяц с пулом до $70–100+ в кредитах и доступом к 30+ быстрым моделям вроде DeepSeek
          V4.1 Flash, GLM-5.3 Flash, Qwen 3.8 Flash и HY4 Flash) есть официальный{' '}
          <strong className="font-medium text-[#111614] dark:text-[#ecece6]">Provider API</strong>{' '}
          по адресу{' '}
          <code className="amp-inline-code break-all">
            https://api.commandcode.ai/provider/v1
          </code>
          . Он понимает стандартный формат OpenAI (<code className="amp-inline-code">/chat/completions</code>)
          и Anthropic (<code className="amp-inline-code">/messages</code>), а список моделей
          возвращает GET-запрос на <code className="amp-inline-code">/models</code>.
        </p>
        <p>
          А как дать доступ к своей подписке друзьям, коллегам или ученикам? Ни в коем случае не
          раздавай основной ключ <code className="amp-inline-code">COMMAND_CODE_API_KEY</code>:
          кто-то случайно запустит бесконечный цикл и за 10 минут сожжёт все твои 5-часовые и
          недельные квоты. Правильное решение — поставить тонкий{' '}
          <strong className="font-medium text-[#111614] dark:text-[#ecece6]">прокси-коннектор</strong>{' '}
          между агентами и Command Code API.
        </p>
      </div>

      {/* Minimal architectural SVG diagram in solid opaque card */}
      <figure className="my-7 rounded-[6px] border border-[#e2e3dd] bg-[#fcfcf9] p-4 shadow-[0_1px_6px_rgba(17,22,20,0.03)] sm:p-5 dark:border-white/[0.1] dark:bg-[#171a19]">
        <svg
          viewBox="0 0 880 175"
          className="h-auto w-full"
          role="img"
          aria-label="Схема работы GOAT-прокси: агент отправляет виртуальный ключ на сервер goat_proxy.py, который проверяет лимит и пересылает запрос в Command Code Provider API с мастер-ключом"
        >
          {/* Node 1 */}
          <rect
            x="10"
            y="24"
            width="242"
            height="122"
            rx="4"
            className="fill-[#f7f7f3] stroke-[#d6d8d1] dark:fill-[#161917] dark:stroke-white/15"
            strokeWidth="1.25"
          />
          <text
            x="28"
            y="54"
            className="fill-[#111614] dark:fill-[#ecece6] text-[14px] font-medium"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Агент ученика / коллеги
          </text>
          <text
            x="28"
            y="80"
            className="fill-[#61655f] dark:fill-[#8e938c] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            key: student_alice_2026
          </text>
          <text
            x="28"
            y="102"
            className="fill-[#61655f] dark:fill-[#8e938c] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            url: твой-сервер:8080/v1
          </text>
          <text
            x="28"
            y="128"
            className="fill-[#61655f] dark:fill-[#8e938c] text-[11.5px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Не видит твой главный ключ
          </text>

          {/* Arrow 1 */}
          <line
            x1="252"
            y1="85"
            x2="314"
            y2="85"
            className="stroke-[#111614] dark:stroke-[#ecece6]"
            strokeWidth="1.5"
          />
          <polygon points="314,80 323,85 314,90" className="fill-[#111614] dark:fill-[#ecece6]" />

          {/* Node 2 */}
          <rect
            x="325"
            y="16"
            width="248"
            height="138"
            rx="4"
            className="fill-white stroke-[#f34f3f] dark:fill-[#1a1d1b] dark:stroke-[#ff6b5b]"
            strokeWidth="1.5"
          />
          <text
            x="343"
            y="46"
            className="fill-[#f34f3f] dark:fill-[#ff6b5b] text-[14px] font-medium"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Твой GOAT-коннектор
          </text>
          <text
            x="343"
            y="68"
            className="fill-[#111614] dark:fill-[#ecece6] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            goat_proxy.py / cmdcode2api
          </text>
          <text
            x="343"
            y="94"
            className="fill-[#3a3e3b] dark:fill-[#b9bdb6] text-[11.5px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            1. Проверяет виртуальный ключ
          </text>
          <text
            x="343"
            y="114"
            className="fill-[#3a3e3b] dark:fill-[#b9bdb6] text-[11.5px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            2. Считает дневной лимит (429)
          </text>
          <text
            x="343"
            y="134"
            className="fill-[#3a3e3b] dark:fill-[#b9bdb6] text-[11.5px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            3. Подставляет мастер-ключ GOAT
          </text>

          {/* Arrow 2 */}
          <line
            x1="573"
            y1="85"
            x2="634"
            y2="85"
            className="stroke-[#3d8b3d] dark:stroke-[#6cc56c]"
            strokeWidth="1.5"
          />
          <polygon points="634,80 643,85 634,90" className="fill-[#3d8b3d] dark:fill-[#6cc56c]" />

          {/* Node 3 */}
          <rect
            x="645"
            y="24"
            width="225"
            height="122"
            rx="4"
            className="fill-[#f7f7f3] stroke-[#d6d8d1] dark:fill-[#161917] dark:stroke-white/15"
            strokeWidth="1.25"
          />
          <text
            x="663"
            y="54"
            className="fill-[#111614] dark:fill-[#ecece6] text-[14px] font-medium"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Command Code GOAT
          </text>
          <text
            x="663"
            y="80"
            className="fill-[#3d8b3d] dark:fill-[#6cc56c] text-[11.5px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            api.commandcode.ai
          </text>
          <text
            x="663"
            y="102"
            className="fill-[#61655f] dark:fill-[#8e938c] text-[11.5px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            /provider/v1/chat/...
          </text>
          <text
            x="663"
            y="128"
            className="fill-[#61655f] dark:fill-[#8e938c] text-[11.5px]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Списывает квоту твоей подписки
          </text>
        </svg>
        <figcaption className="mt-3 text-center font-mono text-[11px] text-[#61655f] dark:text-[#8e938c]">
          Схема раздачи подписки Command Code GOAT через промежуточный прокси с квотами
        </figcaption>
      </figure>

      {/* Interactive Virtual Key Configurator */}
      <div className="my-7 rounded-[6px] border border-[#e2e3dd] bg-[#fcfcf9] p-5 shadow-[0_1px_6px_rgba(17,22,20,0.03)] dark:border-white/[0.1] dark:bg-[#171a19]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-[#111614] dark:text-[#ecece6]">
              Конструктор виртуальных ключей и лимитов
            </h3>
            <p className="mt-1 text-[13px] text-[#61655f] dark:text-[#8e938c]">
              Добавь или поправь ключи — код сервера <code className="amp-inline-code">goat_proxy.py</code>{' '}
              ниже пересоберётся автоматически.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToProxyProvider}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[#2e7d5b]/50 bg-[#2e7d5b]/[0.08] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[#1c4a36] transition-colors hover:border-[#2e7d5b] hover:bg-[#2e7d5b] hover:text-white whitespace-nowrap dark:border-[#4cb888]/50 dark:bg-[#4cb888]/12 dark:text-[#a8e8ca] dark:hover:bg-[#4cb888] dark:hover:text-[#0f1714]"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Режим прокси</span>
          </button>
        </div>

        {/* Keys table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#e4e5df] font-mono text-[10.5px] uppercase tracking-[0.05em] text-[#61655f] dark:border-white/10 dark:text-[#8e938c]">
                <th className="py-2 pr-4 font-medium">Кому выдан</th>
                <th className="py-2 pr-4 font-medium">Ключ</th>
                <th className="py-2 pr-4 font-medium">Лимит / день</th>
                <th className="py-2 text-right font-medium">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ecece6] dark:divide-white/[0.06]">
              {virtualKeys.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2.5 pr-4 font-medium text-[#111614] dark:text-[#ecece6]">
                    {entry.label}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[12px] text-[#3d8b3d] dark:text-[#6cc56c]">
                    {entry.token}
                  </td>
                  <td className="py-2.5 pr-4">
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={entry.dailyLimit}
                      aria-label={`Дневной лимит для ${entry.label}`}
                      onChange={(e) => {
                        const val = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(val) && val > 0) {
                          onUpdateLimit(entry.id, val);
                        }
                      }}
                      className="w-20 rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2 py-1 font-mono text-[12px] tabular-nums text-[#111614] focus:border-[#111614] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      disabled={virtualKeys.length <= 1}
                      onClick={() => onRemoveKey(entry.id)}
                      aria-label={`Удалить ключ ${entry.label}`}
                      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[12px] text-[#61655f] transition-colors hover:bg-[#f34f3f]/10 hover:text-[#f34f3f] disabled:opacity-35 dark:text-[#8e938c] dark:hover:text-[#ff6b5b]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Удалить</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add form */}
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label htmlFor="vk-label" className="sr-only">
              Имя пользователя
            </label>
            <input
              id="vk-label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Имя (напр. Ученик Даша)"
              className="w-full rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2.5 py-2 text-[12.5px] text-[#111614] placeholder:text-[#8c9088] focus:border-[#111614] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
            />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="vk-token" className="sr-only">
              Виртуальный ключ
            </label>
            <input
              id="vk-token"
              type="text"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Ключ (student_dasha_01)"
              className="w-full rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2.5 py-2 font-mono text-[12px] text-[#111614] placeholder:text-[#8c9088] focus:border-[#111614] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vk-limit" className="sr-only">
              Дневной лимит
            </label>
            <input
              id="vk-limit"
              type="number"
              min={1}
              max={5000}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="Лимит"
              className="w-full rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2.5 py-2 font-mono text-[12px] tabular-nums text-[#111614] focus:border-[#111614] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1 rounded-[6px] bg-[#2e7d5b] px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#24664a] whitespace-nowrap dark:bg-[#4cb888] dark:text-[#0f1714] dark:hover:bg-[#5ec898]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Добавить</span>
            </button>
          </div>
        </form>
        {formError && (
          <p role="alert" className="mt-2 text-[12px] font-medium text-[#f34f3f] dark:text-[#ff6b5b]">
            {formError}
          </p>
        )}
      </div>

      <InteractiveCodeBlock
        filename="goat_proxy.py"
        code={goatProxyCode}
        syntaxHintsEnabled={syntaxHintsEnabled}
        activeFunctionId={activeFunctionId}
        onSelectFunction={onSelectFunction}
        onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
      />

      {/* Production notes */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[4px] border border-[#e4e5df] bg-white/45 p-4 dark:border-white/[0.09] dark:bg-white/[0.03]">
          <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
            Готовый шлюз без своего кода: cmdcode2api
          </h3>
          <p className="mt-1.5 text-[13px] leading-[1.58] text-[#4a4e49] dark:text-[#a8aca5]">
            Если нужен не учебный скрипт, а полноценный шлюз с веб-панелью, ротацией аккаунтов и
            учётом 5-часовых и недельных квот Command Code — посмотри открытый проект{' '}
            <code className="amp-inline-code">cmdcode2api</code>. Он поднимает тот же
            OpenAI-совместимый адрес <code className="amp-inline-code">/v1/chat/completions</code>,
            так что <code className="amp-inline-code">provider.py</code> заработает без правок.
          </p>
        </div>

        <div className="rounded-[4px] border border-[#e4e5df] bg-white/45 p-4 dark:border-white/[0.09] dark:bg-white/[0.03]">
          <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
            Нюансы тарифа Command Code
          </h3>
          <p className="mt-1.5 text-[13px] leading-[1.58] text-[#4a4e49] dark:text-[#a8aca5]">
            Нужен активный план <strong className="font-medium text-[#111614] dark:text-[#ecece6]">GOAT</strong>,
            Provider или Pro: базовый промо-тариф Go вернёт{' '}
            <code className="amp-inline-code">403 upgrade_required</code>. Для доступа снаружи
            поставь <code className="amp-inline-code">goat_proxy.py</code> на VPS за HTTPS
            (Caddy/Nginx) и всегда проверяй заголовок <code className="amp-inline-code">Authorization</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
