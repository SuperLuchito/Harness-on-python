import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCode2,
  FileText,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { PROVIDERS } from '../data/providers';
import { ProviderId, SimulatorNode, SimulatorScenarioId } from '../types/guide';
import { buildSimulatorSteps, SIMULATOR_SCENARIOS } from '../utils/agentSimulator';

interface AgentLoopSimulatorProps {
  providerId: ProviderId;
  selectedModel: string;
  onInspectFunction: (fnId: string) => void;
}

const NODE_META: Array<{ id: SimulatorNode; label: string; sublabel: string; fnId: string }> = [
  { id: 'user', label: '01 · Вы', sublabel: 'input()', fnId: 'get_user_message' },
  { id: 'loop', label: '02 · Цикл', sublabel: 'run_agent()', fnId: 'run_agent' },
  { id: 'provider', label: '03 · LLM', sublabel: 'ask_model()', fnId: 'ask_model' },
  { id: 'tools', label: '04 · Диск', sublabel: 'execute_tool()', fnId: 'execute_tool' },
];

function getVirtualFilePreview(fileName: string, status: string): string {
  if (fileName === 'secret-file.txt') {
    return 'Что становится всё более влажным, пока кого-то сушит?';
  }
  if (fileName === 'fizzbuzz.py') {
    return `for n in range(1, 21):\n    if n % 15 == 0:\n        print("FizzBuzz")\n    elif n % 3 == 0:\n        print("Fizz")\n    elif n % 5 == 0:\n        print("Buzz")\n    else:\n        print(n)`;
  }
  if (fileName === 'congrats.py') {
    return `import codecs\n\nsecret = "Pbatenghyngvbaf, lbh ohvyg na ntrag!"\nprint(codecs.decode(secret, "rot_13"))`;
  }
  if (fileName === 'provider.py') {
    return `# Адаптер провайдера\ndef create_client(): ...\ndef ask_model(client, conversation, tools=None): ...`;
  }
  return `# Главный цикл агента (${status})\nwhile True:\n    reply = ask_model(client, conversation, TOOLS)\n    ...`;
}

export function AgentLoopSimulator({
  providerId,
  selectedModel,
  onInspectFunction,
}: AgentLoopSimulatorProps) {
  const [scenarioId, setScenarioId] = useState<SimulatorScenarioId>('riddle');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  const steps = useMemo(
    () => buildSimulatorSteps(scenarioId, providerId, selectedModel),
    [scenarioId, providerId, selectedModel]
  );

  const currentStep = steps[Math.min(stepIdx, steps.length - 1)];
  const providerCfg = PROVIDERS[providerId];

  useEffect(() => {
    setStepIdx(0);
    setIsPlaying(false);
    setPreviewFileName(null);
  }, [scenarioId]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying, steps.length]);

  const previewFile = currentStep.files.find((f) => f.name === previewFileName) ?? null;

  return (
    <motion.section
      id="simulator"
      aria-labelledby="simulator-heading"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-24 border-t border-[#e4e5df] pt-12 dark:border-white/[0.08]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
        ИНТЕРАКТИВ · МЕХАНИКА ЦИКЛА
      </p>
      <h2
        id="simulator-heading"
        className="mt-2 text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]"
      >
        Пошаговый симулятор цикла агента
      </h2>
      <p className="mt-2.5 text-[15px] leading-[1.6] text-[#111614]/82 dark:text-[#ecece6]/82">
        Посмотри, как цикл <code className="amp-inline-code">while True</code> гоняет сообщения
        между тобой, провайдером{' '}
        <strong className="font-medium text-[#111614] dark:text-[#ecece6]">
          {providerCfg.shortName}
        </strong>{' '}
        и файлами на диске. Нажимай на узлы схемы или на файлы ниже, чтобы заглянуть внутрь.
      </p>

      {/* Scenario tabs */}
      <div
        className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="tablist"
        aria-label="Сценарии симулятора"
      >
        {SIMULATOR_SCENARIOS.map((sc) => {
          const active = sc.id === scenarioId;
          return (
            <motion.button
              key={sc.id}
              type="button"
              role="tab"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              aria-selected={active}
              onClick={() => setScenarioId(sc.id)}
              className={`rounded-[6px] border px-3 py-2.5 text-left transition-all ${
                active
                  ? 'border-[#2e7d5b]/70 bg-[#2e7d5b]/[0.09] text-[#111614] shadow-[0_1px_8px_rgba(46,125,91,0.1)] dark:border-[#4cb888]/65 dark:bg-[#4cb888]/[0.13] dark:text-[#f0f4f1]'
                  : 'border-[#e2e3dd] bg-white/75 text-[#2e322f] hover:border-[#2e7d5b]/45 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-[#c7cac3] dark:hover:border-[#4cb888]/45'
              }`}
            >
              <div className="text-[12.5px] font-medium">{sc.title}</div>
              <div
                className={`mt-0.5 text-[11px] ${
                  active ? 'text-[#246348] dark:text-[#84d9b2]' : 'text-[#61655f] dark:text-[#8e938c]'
                }`}
              >
                {sc.subtitle}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Unified Solid Opaque Simulator Deck */}
      <div className="mt-5 space-y-4 rounded-[6px] border border-[#dcdcd4] bg-[#fcfcf9] p-4 shadow-[0_2px_10px_rgba(17,22,20,0.04)] sm:p-5 dark:border-white/[0.1] dark:bg-[#161918]">
        {/* Active step header + clickable timeline progress */}
        <div className="space-y-2.5 border-b border-[#ecece6] pb-3.5 dark:border-white/[0.07]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.05em] tabular-nums text-[#2e7d5b] dark:text-[#4cb888]">
              ШАГ {stepIdx + 1} / {steps.length} · CONVERSATION[{currentStep.conversationCount}]
            </span>
            <button
              type="button"
              onClick={() => onInspectFunction(currentStep.activeFunction)}
              className="font-mono text-[11.5px] text-[#1c3229] underline decoration-[#2e7d5b]/55 underline-offset-2 hover:opacity-75 dark:text-[#dce8e1]"
            >
              разобрать {currentStep.activeFunction}()
            </button>
          </div>

          <div className="flex gap-1.5" role="group" aria-label="Переход по шагам симулятора">
            {steps.map((s, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Перейти к шагу ${idx + 1}: ${s.title}`}
                onClick={() => {
                  setIsPlaying(false);
                  setStepIdx(idx);
                }}
                className="group relative h-2 flex-1 rounded-full bg-[#e4e5df] transition-colors hover:bg-[#cfd1c9] dark:bg-white/10 dark:hover:bg-white/20"
              >
                <span
                  className={`block h-full rounded-full transition-all duration-300 ${
                    idx < stepIdx
                      ? 'w-full bg-[#2e7d5b]/70 dark:bg-[#4cb888]/70'
                      : idx === stepIdx
                        ? 'w-full bg-[#2e7d5b] dark:bg-[#4cb888]'
                        : 'w-0'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 4-Node interactive clickable state strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NODE_META.map((node) => {
            const isActive = currentStep.activeNode === node.id;
            return (
              <motion.button
                key={node.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onInspectFunction(node.fnId)}
                title={`Нажмите, чтобы разобрать функцию ${node.fnId}()`}
                className={`relative rounded-[6px] border px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? 'border-[#2e7d5b]/70 bg-[#2e7d5b]/[0.1] text-[#111614] dark:border-[#4cb888]/70 dark:bg-[#4cb888]/15 dark:text-[#ecece6]'
                    : 'border-[#e6e7e1] bg-[#f7f7f3]/80 text-[#61655f] hover:border-[#2e7d5b]/40 hover:text-[#111614] dark:border-white/[0.07] dark:bg-[#121413]/75 dark:text-[#8e938c] dark:hover:text-[#ecece6]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sim-node-accent"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="pointer-events-none absolute inset-0 rounded-[6px] ring-1 ring-[#2e7d5b]/45 dark:ring-[#4cb888]/45"
                  />
                )}
                <div className="text-[12px] font-medium">{node.label}</div>
                <div className="mt-0.5 font-mono text-[10.5px] opacity-80">{node.sublabel}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Step description & live payload with smooth transitions */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${scenarioId}-${stepIdx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-[15px] font-medium text-[#111614] dark:text-[#ecece6]">
                {currentStep.title}
              </h3>
              <p className="mt-1 text-[14px] leading-[1.58] text-[#3a3e3b] dark:text-[#b9bdb6]">
                {currentStep.explanation}
              </p>
            </div>

            {/* Live Terminal + JSON Payload side by side */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="min-w-0 rounded-[4px] border border-[#e4e5df] bg-[#f7f7f3] p-3 font-mono text-[12px] leading-[1.58] text-[#111614] dark:border-white/[0.08] dark:bg-[#121413] dark:text-[#e8e8e2]">
                <div className="mb-2 text-[10px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                  ТЕРМИНАЛ · {providerCfg.shortName}
                </div>
                <div className="min-h-[110px] space-y-1.5">
                  {currentStep.terminalLines.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words">
                      {line.speaker === 'system' && (
                        <span className="text-[#61655f] dark:text-[#8e938c]">{line.text}</span>
                      )}
                      {line.speaker === 'user' && (
                        <>
                          <span className="font-medium text-[#2563eb] dark:text-[#7dd3fc]">Вы: </span>
                          <span>{line.text}</span>
                        </>
                      )}
                      {line.speaker === 'tool' && (
                        <>
                          <span className="font-medium text-[#3d8b3d] dark:text-[#6cc56c]">tool: </span>
                          <span className="text-[#2f6f2f] dark:text-[#8fd98f]">{line.text}</span>
                        </>
                      )}
                      {line.speaker === 'model' && (
                        <>
                          <span className="font-medium text-[#c18401] dark:text-[#e5a93c]">
                            {providerCfg.assistantDisplayName}:{' '}
                          </span>
                          <span>{line.text}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-[4px] border border-[#e4e5df] bg-[#f7f7f3] p-3 dark:border-white/[0.08] dark:bg-[#121413]">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                  JSON НА ЭТОМ ШАГЕ
                </div>
                <pre className="code-scroll max-h-44 overflow-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-[#2e322f] dark:text-[#cfd2cc]">
                  {currentStep.payloadPreview}
                </pre>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Interactive Clickable Virtual Folder State */}
        <div>
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
            <span>ФАЙЛЫ В ПАПКЕ ПРОЕКТА</span>
            <span className="normal-case opacity-80">нажми на файл, чтобы заглянуть внутрь</span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {currentStep.files.map((file) => {
              const statusLabel =
                file.status === 'created'
                  ? 'создан'
                  : file.status === 'read'
                    ? 'прочитан'
                    : file.status === 'edited'
                      ? 'изменён'
                      : 'на диске';
              const isSelected = previewFileName === file.name;
              const highlight =
                file.status === 'created' || file.status === 'edited'
                  ? 'border-[#3d8b3d] bg-[#3d8b3d]/[0.08] dark:border-[#6cc56c] dark:bg-[#6cc56c]/12'
                  : file.status === 'read'
                    ? 'border-[#c18401] bg-[#c18401]/[0.08] dark:border-[#e5a93c] dark:bg-[#e5a93c]/12'
                    : 'border-[#e6e7e1] bg-[#f7f7f3] hover:border-[#b5b8b0] dark:border-white/[0.07] dark:bg-[#121413] dark:hover:border-white/25';

              return (
                <motion.button
                  key={file.name}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setPreviewFileName((prev) => (prev === file.name ? null : file.name))
                  }
                  aria-expanded={isSelected}
                  className={`rounded-[5px] border px-3 py-2 text-left transition-all ${highlight} ${
                    isSelected ? 'ring-1 ring-[#111614] dark:ring-[#ecece6]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 font-mono text-[12px] font-medium text-[#111614] dark:text-[#ecece6]">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {file.name.endsWith('.py') ? (
                        <FileCode2
                          className="h-3.5 w-3.5 shrink-0 text-[#f34f3f] dark:text-[#ff6b5b]"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-[#61655f] dark:text-[#8e938c]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{file.name}</span>
                    </span>
                    <Eye className="h-3 w-3 shrink-0 opacity-45" aria-hidden="true" />
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-[#61655f] dark:text-[#8e938c]">
                    {statusLabel}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Animated File Preview Panel */}
          <AnimatePresence initial={false}>
            {previewFile && (
              <motion.div
                key={`preview-${previewFile.name}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 rounded-[5px] border border-[#dcdcd4] bg-[#f7f7f3] p-3 dark:border-white/12 dark:bg-[#121413]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-medium text-[#8a6d3b] dark:text-[#b89c66]">
                      Содержимое {previewFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewFileName(null)}
                      aria-label="Закрыть просмотр файла"
                      className="rounded p-0.5 text-[#61655f] hover:bg-black/5 hover:text-[#111614] dark:text-[#8e938c] dark:hover:bg-white/10"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <pre className="mt-1.5 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-[#111614] dark:text-[#e8e8e2]">
                    {getVirtualFilePreview(previewFile.name, previewFile.status)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#ecece6] pt-3.5 dark:border-white/[0.07]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((prev) => Math.max(0, prev - 1));
            }}
            disabled={stepIdx === 0}
            aria-label="Предыдущий шаг симулятора"
            className="inline-flex items-center gap-1 rounded-[6px] border border-[#dcdcd4] bg-[#f7f7f3] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#111614] transition-colors hover:border-[#2e7d5b] disabled:opacity-35 dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6] dark:hover:border-[#4cb888]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Назад</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((prev) => Math.min(steps.length - 1, prev + 1));
            }}
            disabled={stepIdx === steps.length - 1}
            aria-label="Следующий шаг симулятора"
            className="inline-flex items-center gap-1 rounded-[6px] bg-[#2e7d5b] px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-white shadow-[0_1px_5px_rgba(46,125,91,0.25)] transition-colors hover:bg-[#24664a] disabled:opacity-35 dark:bg-[#4cb888] dark:text-[#0f1714] dark:hover:bg-[#5ec898]"
          >
            <span>Далее</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (stepIdx === steps.length - 1) setStepIdx(0);
              setIsPlaying((p) => !p);
            }}
            className={`inline-flex items-center gap-1 rounded-[6px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors ${
              isPlaying
                ? 'border-[#d9533f] bg-[#d9533f]/10 text-[#c9422e] dark:border-[#f07460] dark:text-[#f07460]'
                : 'border-[#dcdcd4] bg-white/80 text-[#111614] hover:border-[#2e7d5b] dark:border-white/15 dark:bg-white/[0.04] dark:text-[#ecece6] dark:hover:border-[#4cb888]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Авто</span>
              </>
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(0);
              setPreviewFileName(null);
            }}
            aria-label="Сбросить симулятор"
            className="ml-auto inline-flex items-center gap-1 rounded-[4px] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#61655f] hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Сброс</span>
          </button>
        </div>
      </div>
    </motion.section>
  );
}
