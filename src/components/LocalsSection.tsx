import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Cpu, ExternalLink, Layers, Lock, Terminal, Wrench } from 'lucide-react';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';

interface LocalsSectionProps {
  isLocalsSelected: boolean;
  onSelectLocalsProvider: () => void;
}

type IntegrationTab = 'harness_py' | 'json' | 'typescript';

interface PipelineStage {
  id: string;
  label: string;
  sublabel: string;
  detail: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'agent',
    label: 'agent.py',
    sublabel: 'цикл + tools',
    detail:
      'Твой цикл run_agent() и три инструмента (read_file, list_files, edit_file) остаются без единой правки.',
  },
  {
    id: 'provider',
    label: 'provider.py',
    sublabel: 'OpenAI SDK',
    detail:
      'Адаптер перенаправляет запросы на BASE_URL = "http://127.0.0.1:8321/v1" с ключом "local" и моделью locals/inkling-2-mini-mlx-nvfp4.',
  },
  {
    id: 'locals',
    label: 'Locals',
    sublabel: '127.0.0.1:8321',
    detail:
      'Локальный OpenAI-совместимый сервер принимает /v1/chat/completions, кэширует контекст и поддерживает Streaming и Tool Calling.',
  },
  {
    id: 'mlx',
    label: 'MLX / Metal',
    sublabel: 'Inkling 2 Mini',
    detail:
      'Модель Thinking Machines Inkling 2 Mini (MLX NVFP4 + DSpark) исполняется на Apple Silicon локально, без оплаты за токены.',
  },
];

const CONNECTION_PARAMS = [
  { param: 'Protocol', value: 'OpenAI Compatible' },
  { param: 'Base URL', value: 'http://127.0.0.1:8321/v1' },
  { param: 'Chat endpoint', value: 'http://127.0.0.1:8321/v1/chat/completions' },
  { param: 'Models endpoint', value: 'http://127.0.0.1:8321/v1/models' },
  { param: 'Health / Stats', value: 'http://127.0.0.1:8321/health · /stats' },
  { param: 'API key', value: 'local (фиктивный ключ для совместимости с OpenAI SDK)' },
  { param: 'Model ID', value: 'locals/inkling-2-mini-mlx-nvfp4' },
  { param: 'Возможности', value: 'Streaming + Tool Calling' },
];

const INTEGRATION_SNIPPETS: Record<
  IntegrationTab,
  {
    label: string;
    filename: string;
    language: 'python' | 'json' | 'typescript';
    caption: string;
    code: string;
  }
> = {
  harness_py: {
    label: 'provider.py (наш Harness)',
    filename: 'provider.py — подключение Locals к agent.py',
    language: 'python',
    caption:
      'Готовый адаптер для нашего агента. Подменяет только BASE_URL, MODEL_NAME и ключ — файл agent.py продолжает работать с read_file, list_files и edit_file без изменений.',
    code: `# provider.py — адаптер Locals для собственного Harness
import json
import os
from openai import OpenAI

BASE_URL = "http://127.0.0.1:8321/v1"
MODEL_NAME = "locals/inkling-2-mini-mlx-nvfp4"


def create_client():
    # Облачный ключ не нужен: "local" требуется только OpenAI SDK
    api_key = os.environ.get("LOCALS_API_KEY", "local")
    return OpenAI(api_key=api_key, base_url=BASE_URL)


def format_tools(tools):
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        }
        for tool in tools
    ]


def make_tool_result_message(tool_call_id, result_text, is_error=False):
    prefix = "Ошибка: " if is_error else ""
    return {
        "role": "tool",
        "tool_call_id": tool_call_id,
        "content": prefix + result_text,
    }


def ask_model(client, conversation, tools=None):
    params = {
        "model": MODEL_NAME,
        "messages": conversation,
        "max_tokens": 4096,
    }
    if tools:
        params["tools"] = format_tools(tools)

    response = client.chat.completions.create(**params)
    message = response.choices[0].message

    tool_calls = []
    raw_tool_calls = []
    for call in message.tool_calls or []:
        args = json.loads(call.function.arguments or "{}")
        tool_calls.append({"id": call.id, "name": call.function.name, "args": args})
        raw_tool_calls.append({
            "id": call.id,
            "type": "function",
            "function": {
                "name": call.function.name,
                "arguments": call.function.arguments or "{}",
            },
        })

    raw_message = {"role": "assistant", "content": message.content or ""}
    if raw_tool_calls:
        raw_message["tool_calls"] = raw_tool_calls

    return {
        "text": message.content or "",
        "tool_calls": tool_calls,
        "raw_message": raw_message,
    }`,
  },
  json: {
    label: 'JSON-конфиг провайдера',
    filename: 'provider.locals.json',
    language: 'json',
    caption:
      'Если твой харнесс читает провайдеров из конфигурационного файла — используй этот шаблон и адаптируй имена полей.',
    code: `{
  "id": "locals",
  "name": "Locals",
  "type": "openai-compatible",
  "baseURL": "http://127.0.0.1:8321/v1",
  "apiKey": "local",
  "model": "locals/inkling-2-mini-mlx-nvfp4",
  "contextWindow": 65536,
  "maxOutputTokens": 32768,
  "streaming": true,
  "toolCalling": true
}`,
  },
  typescript: {
    label: 'TypeScript (Streaming)',
    filename: 'locals_stream.ts',
    language: 'typescript',
    caption:
      'Пример потокового обращения к локальной модели, если твой харнесс написан на TypeScript / Node.js.',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:8321/v1",
  apiKey: "local",
});

const stream = await client.chat.completions.create({
  model: "locals/inkling-2-mini-mlx-nvfp4",
  messages: [{ role: "user", content: "Проверь список файлов в проекте." }],
  max_tokens: 1024,
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}`,
  },
};

export function LocalsSection({
  isLocalsSelected,
  onSelectLocalsProvider,
}: LocalsSectionProps) {
  const [activeStageId, setActiveStageId] = useState<string>('provider');
  const [integrationTab, setIntegrationTab] = useState<IntegrationTab>('harness_py');

  const activeStage =
    PIPELINE_STAGES.find((stage) => stage.id === activeStageId) ?? PIPELINE_STAGES[1];
  const currentSnippet = INTEGRATION_SNIPPETS[integrationTab];

  return (
    <section
      id="locals"
      aria-labelledby="locals-heading"
      className="scroll-mt-24 border-t border-[#d8dad3] pt-12 dark:border-white/[0.1]"
    >
      {/* Header + 1-click activate button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-[#2e7d5b] dark:text-[#4cb888]">
            ЛОКАЛЬНЫЙ ПРОВАЙДЕР // LOCALS → HARNESS
          </p>
          <h2
            id="locals-heading"
            className="mt-2 text-[26px] font-medium leading-[1.2] tracking-[-0.015em] text-[#111614] dark:text-[#ecece6]"
          >
            Подключаем Locals к нашему Harness
          </h2>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelectLocalsProvider}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] transition-colors whitespace-nowrap ${
            isLocalsSelected
              ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
              : 'border-[#2e7d5b]/50 bg-[#2e7d5b]/[0.08] text-[#1c4a36] hover:border-[#2e7d5b] hover:bg-[#2e7d5b] hover:text-white dark:border-[#4cb888]/50 dark:bg-[#4cb888]/12 dark:text-[#a8e8ca] dark:hover:bg-[#4cb888] dark:hover:text-[#0f1714]'
          }`}
        >
          {isLocalsSelected ? (
            <>
              <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Locals активен в примерах</span>
            </>
          ) : (
            <>
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Выбрать Locals для всего сайта</span>
            </>
          )}
        </motion.button>
      </div>

      <p className="mt-4 text-[15.5px] leading-[1.65] text-[#111614]/82 dark:text-[#ecece6]/82">
        <strong className="font-medium text-[#111614] dark:text-[#ecece6]">Locals</strong> —
        открытый движок для локального запуска LLM на Apple Silicon (MLX/Metal + Speculative
        Decoding DSpark для{' '}
        <strong className="font-medium text-[#111614] dark:text-[#ecece6]">Inkling 2 Mini</strong>).
        Он поднимает стандартный OpenAI-совместимый сервер на{' '}
        <code className="amp-inline-code">http://127.0.0.1:8321/v1</code>, поэтому наш{' '}
        <code className="amp-inline-code">agent.py</code> подключается к нему за пару минут —
        достаточно обновить адаптер <code className="amp-inline-code">provider.py</code>.
      </p>

      {/* Interactive 4-stage pipeline */}
      <div className="my-6 rounded-[8px] border border-[#dce0d8] bg-[#fcfcf9] p-4 shadow-[0_2px_10px_rgba(17,22,20,0.03)] sm:p-5 dark:border-white/[0.1] dark:bg-[#171a19]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>КАК НАШ HARNESS ОБЩАЕТСЯ С LOCALS</span>
          </span>
          <span className="font-mono text-[10.5px] text-[#61655f] dark:text-[#8e938c]">
            нажми на этап для пояснения
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Схема подключения Harness к Locals"
          className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          {PIPELINE_STAGES.map((stage, idx) => {
            const isSelected = stage.id === activeStage.id;
            return (
              <div key={stage.id} className="flex flex-1 items-center gap-1.5">
                <motion.button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`w-full rounded-[6px] border px-2.5 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#2e7d5b] bg-[#2e7d5b]/[0.1] text-[#111614] shadow-[0_1px_6px_rgba(46,125,91,0.14)] dark:border-[#4cb888] dark:bg-[#4cb888]/15 dark:text-[#f0f4f1]'
                      : 'border-[#e2e3dd] bg-[#f7f7f3] text-[#3c403c] hover:border-[#2e7d5b]/45 dark:border-white/[0.08] dark:bg-[#121413] dark:text-[#b6bab3]'
                  }`}
                >
                  <div className="font-mono text-[11.5px] font-medium leading-tight">
                    {stage.label}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-[#61655f] dark:text-[#8e938c]">
                    {stage.sublabel}
                  </div>
                </motion.button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight
                    className="hidden h-3.5 w-3.5 shrink-0 text-[#9ba098] sm:block dark:text-white/25"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18 }}
            className="mt-3 rounded-[6px] border border-[#e6e7e1] bg-[#f7f7f3] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#2e322f] dark:border-white/[0.07] dark:bg-[#121413] dark:text-[#c7cbc4]"
          >
            <span className="font-mono text-[11.5px] font-medium text-[#2e7d5b] dark:text-[#4cb888]">
              {activeStage.label}
            </span>
            <span className="mx-1.5 opacity-45">—</span>
            {activeStage.detail}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step 1: Start local server */}
      <div className="mt-8 space-y-3">
        <h3 className="flex items-center gap-2 text-[18px] font-medium text-[#111614] dark:text-[#ecece6]">
          <span className="font-mono text-[12px] text-[#2e7d5b] dark:text-[#4cb888]">01 //</span>
          <span>Запусти локальный сервер Locals</span>
        </h3>
        <p className="text-[14.5px] leading-[1.6] text-[#2c312e] dark:text-[#c7cbc4]">
          Перед запуском <code className="amp-inline-code">python agent.py</code> подними сервер с
          локальной сборкой модели и проверь, какой <code className="amp-inline-code">Model ID</code>{' '}
          он отдаёт по API (обычно{' '}
          <code className="amp-inline-code">locals/inkling-2-mini-mlx-nvfp4</code> или вариант{' '}
          <code className="amp-inline-code">-thinking</code>):
        </p>

        <InteractiveCodeBlock
          filename="терминал — запуск и проверка Locals"
          language="bash"
          code={`# Запуск сервера с базовым окном 64K / 32K
locals start \\
  --model ~/models/Inkling-2-Mini-MLX-nvfp4 \\
  --max-context 65536 \\
  --max-tokens 32768

# Проверка доступных моделей и статуса сервера
curl -s http://127.0.0.1:8321/v1/models | python3 -m json.tool
locals status

# Остановка перед сменой параметров
locals stop`}
        />
      </div>

      {/* Step 2: Connection parameters */}
      <div className="mt-8 space-y-3">
        <h3 className="flex items-center gap-2 text-[18px] font-medium text-[#111614] dark:text-[#ecece6]">
          <span className="font-mono text-[12px] text-[#2e7d5b] dark:text-[#4cb888]">02 //</span>
          <span>Параметры подключения для нашего Harness</span>
        </h3>

        <div className="overflow-hidden rounded-[7px] border border-[#e0e2dc] bg-[#fcfcf9] dark:border-white/[0.09] dark:bg-[#171a19]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e4e5df] bg-[#f4f4ef] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#61655f] dark:border-white/[0.08] dark:bg-[#1b1f1d] dark:text-[#8e938c]">
                  <th className="px-4 py-2 font-medium">Параметр</th>
                  <th className="px-4 py-2 font-medium">Значение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecece6] dark:divide-white/[0.06]">
                {CONNECTION_PARAMS.map((row) => (
                  <tr key={row.param}>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-[12px] font-medium text-[#111614] dark:text-[#ecece6]">
                      {row.param}
                    </td>
                    <td className="break-all px-4 py-2 font-mono text-[12px] text-[#2c312e] dark:text-[#c7cbc4]">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 3: Code to plug Locals into our Harness */}
      <div className="mt-8 space-y-3">
        <h3 className="flex items-center gap-2 text-[18px] font-medium text-[#111614] dark:text-[#ecece6]">
          <span className="font-mono text-[12px] text-[#2e7d5b] dark:text-[#4cb888]">03 //</span>
          <span>Добавляем поддержку Locals в код харнесса</span>
        </h3>

        <div
          role="tablist"
          aria-label="Примеры интеграции Locals в харнесс"
          className="flex flex-wrap gap-1.5"
        >
          {(['harness_py', 'json', 'typescript'] as IntegrationTab[]).map((tabKey) => {
            const active = integrationTab === tabKey;
            return (
              <motion.button
                key={tabKey}
                type="button"
                role="tab"
                whileTap={{ scale: 0.97 }}
                aria-selected={active}
                onClick={() => setIntegrationTab(tabKey)}
                className={`rounded-[6px] border px-3 py-1.5 font-mono text-[12px] transition-all ${
                  active
                    ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white shadow-[0_1px_6px_rgba(46,125,91,0.2)] dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                    : 'border-[#e0e2dc] bg-white/75 text-[#424742] hover:border-[#2e7d5b]/45 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-[#b6bab3]'
                }`}
              >
                {INTEGRATION_SNIPPETS[tabKey].label}
              </motion.button>
            );
          })}
        </div>

        <p className="text-[13.5px] text-[#61655f] dark:text-[#8e938c]">{currentSnippet.caption}</p>

        <InteractiveCodeBlock
          filename={currentSnippet.filename}
          language={currentSnippet.language}
          code={currentSnippet.code}
          syntaxHintsEnabled={false}
        />
      </div>

      {/* Practical harness checklist & security reminder */}
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[7px] border border-[#e0e2dc] bg-[#fcfcf9] p-4 dark:border-white/[0.09] dark:bg-[#171a19]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ЧТО УЧЕСТЬ В СВОЁМ ХАРНЕССЕ</span>
          </div>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-[#3a3f3b] dark:text-[#b9bdb6]">
            <li>Всегда проверяй валидность JSON-аргументов инструментов перед выполнением на диске.</li>
            <li>Возвращай каждый результат с исходным <code className="amp-inline-code">tool_call_id</code> и контролируй длину истории.</li>
            <li>Перед стартом агента полезно дёрнуть <code className="amp-inline-code">/health</code> и задать разумные тайм-ауты HTTP-клиента.</li>
          </ul>
        </div>

        <div className="rounded-[7px] border border-[#d69e2e]/40 bg-[#d69e2e]/[0.06] p-4 dark:border-[#e6be5a]/35 dark:bg-[#e6be5a]/[0.08]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#9b6811] dark:text-[#ecc463]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ТОЛЬКО ЛОКАЛЬНЫЙ ИНТЕРФЕЙС</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#3a3529] dark:text-[#dcd3bd]">
            Locals слушает только <code className="amp-inline-code">127.0.0.1:8321</code> —
            внешние сайты не видят его напрямую, и открывать этот порт в интернет без TLS и
            авторизации не нужно.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11.5px]">
            <a
              href="https://github.com/Generated-Computers/Locals"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#2e7d5b] underline underline-offset-3 hover:opacity-80 dark:text-[#4cb888]"
            >
              <Terminal className="h-3 w-3" aria-hidden="true" />
              <span>GitHub Locals</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href="https://huggingface.co/thinkingmachines/Inkling-2-Mini"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#2e7d5b] underline underline-offset-3 hover:opacity-80 dark:text-[#4cb888]"
            >
              <span>Inkling 2 Mini</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
