import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Copy, X } from 'lucide-react';
import { FUNCTION_DOCS, SYNTAX_DOCS } from '../data/pythonGlossary';
import {
  extractClickableFunctions,
  tokenizeBashLine,
  tokenizeJsonLine,
  tokenizePythonLine,
  tokenizeTsLine,
} from '../utils/codeTokenizer';

export type CodeLanguage = 'python' | 'bash' | 'json' | 'typescript' | 'text';

interface InteractiveCodeBlockProps {
  code: string;
  filename?: string;
  language?: CodeLanguage;
  syntaxHintsEnabled?: boolean;
  activeFunctionId?: string | null;
  onSelectFunction?: (fnId: string) => void;
  onOpenGlossaryWithSyntax?: (syntaxId: string) => void;
  showLineNumbers?: boolean;
}

interface ActiveSyntaxPopover {
  syntaxId: string;
  lineIndex: number;
}

const LITERAL_SYNTAX_IDS = new Set(['bool_none']);

const LANGUAGE_BADGE: Record<CodeLanguage, string> = {
  python: 'PY',
  bash: 'SH',
  json: 'JSON',
  typescript: 'TS',
  text: 'TXT',
};

export function InteractiveCodeBlock({
  code,
  filename,
  language = 'python',
  syntaxHintsEnabled = true,
  activeFunctionId = null,
  onSelectFunction,
  onOpenGlossaryWithSyntax,
  showLineNumbers = true,
}: InteractiveCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [activePopover, setActivePopover] = useState<ActiveSyntaxPopover | null>(null);

  const lines = useMemo(() => code.split('\n'), [code]);

  const tokenizedLines = useMemo(() => {
    if (language === 'python') return lines.map((line) => tokenizePythonLine(line));
    if (language === 'bash') return lines.map((line) => tokenizeBashLine(line));
    if (language === 'json') return lines.map((line) => tokenizeJsonLine(line));
    if (language === 'typescript') return lines.map((line) => tokenizeTsLine(line));
    return null;
  }, [lines, language]);

  const clickableFunctions = useMemo(() => {
    if (language !== 'python' || !onSelectFunction) return [];
    return extractClickableFunctions(code);
  }, [code, language, onSelectFunction]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const activeSyntaxDoc = activePopover ? SYNTAX_DOCS[activePopover.syntaxId] : null;
  const displayGutter = showLineNumbers && lines.length > 1;

  return (
    <div className="my-6 min-w-0 max-w-full overflow-hidden rounded-[7px] border border-[#dcdcd4] bg-[#ffffff] shadow-[0_2px_12px_rgba(17,22,20,0.045)] dark:border-white/[0.11] dark:bg-[#151817] dark:shadow-[0_6px_22px_rgba(0,0,0,0.36)]">
      {/* Solid dedicated code window header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#e8e8e2] bg-[#f4f4ef] px-3.5 py-2 dark:border-white/[0.08] dark:bg-[#1b1f1d]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e39b8e] dark:bg-[#c96e60]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e5c47c] dark:bg-[#c9a959]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8ec7a4] dark:bg-[#5ea37c]/60" />
          </span>
          {filename && (
            <span className="truncate font-mono text-[11px] text-[#6d5936] dark:text-[#ccb27f]">
              {language === 'python' ? `# ${filename}` : filename}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-[3px] border border-[#e0e1da] bg-white/70 px-1.5 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#6a6e68] sm:inline-block dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-[#8e948d]">
            {LANGUAGE_BADGE[language]}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            aria-label={filename ? `Скопировать код файла ${filename}` : 'Скопировать код'}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-[11px] transition-colors whitespace-nowrap ${
              copied
                ? 'border-[#2e7d5b]/40 bg-[#2e7d5b]/10 text-[#236348] dark:border-[#4cb888]/45 dark:bg-[#4cb888]/15 dark:text-[#7edcb0]'
                : 'border-transparent text-[#555a54] hover:border-[#dcdcd4] hover:bg-white hover:text-[#111614] dark:text-[#989d95] dark:hover:border-white/15 dark:hover:bg-white/[0.06] dark:hover:text-[#ecece6]'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#2e7d5b] dark:text-[#4cb888]" aria-hidden="true" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Копировать</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Solid opaque code viewport with multi-tone syntax highlighting */}
      <div className="code-scroll min-w-0 max-w-full overflow-x-auto bg-[#ffffff] px-3.5 py-3.5 font-mono text-[13px] leading-[1.58] text-[#1a1f1c] dark:bg-[#151817] dark:text-[#e6e8e3]">
        <pre className="m-0 min-w-0">
          <code>
            {lines.map((line, lineIdx) => {
              const tokens = tokenizedLines?.[lineIdx];
              const showPopoverHere =
                activePopover && activePopover.lineIndex === lineIdx && activeSyntaxDoc;

              return (
                <div key={lineIdx} className="min-w-0">
                  <div className="flex min-w-0 items-start rounded-[3px] transition-colors hover:bg-[#111614]/[0.025] dark:hover:bg-white/[0.025]">
                    {displayGutter && (
                      <span
                        aria-hidden="true"
                        className="mr-3.5 inline-block w-6 shrink-0 select-none text-right text-[11.5px] tabular-nums text-[#a5a9a0] dark:text-[#555c57]"
                      >
                        {lineIdx + 1}
                      </span>
                    )}
                    <div className="min-w-0 flex-1 whitespace-pre">
                      {!tokens
                        ? line || ' '
                        : tokens.length === 0
                          ? ' '
                          : tokens.map((tok, tIdx) => {
                              if (tok.kind === 'comment') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="italic text-[#8b7a5e] dark:text-[#9c8f73]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'string') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#26734d] dark:text-[#6fd098]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'number') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#b86b14] dark:text-[#e8a855]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'builtin') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#275996] dark:text-[#7ab3f0]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'constant') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#7c3d8c] dark:text-[#c894e0]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'property') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#1c7275] dark:text-[#5cc2c2]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (tok.kind === 'flag') {
                                return (
                                  <span
                                    key={tIdx}
                                    className="text-[#396594] dark:text-[#84b6e8]"
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              if (
                                tok.kind === 'function' &&
                                tok.refId &&
                                FUNCTION_DOCS[tok.refId] &&
                                onSelectFunction
                              ) {
                                const fnDoc = FUNCTION_DOCS[tok.refId];
                                const isSelected = activeFunctionId === tok.refId;
                                return (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    data-active={isSelected ? 'true' : 'false'}
                                    onClick={() => {
                                      setActivePopover(null);
                                      onSelectFunction(tok.refId!);
                                    }}
                                    title={`Нажмите, чтобы разобрать функцию ${fnDoc.name}()`}
                                    aria-label={`Разобрать функцию ${fnDoc.name}`}
                                    className="code-fn-token inline font-mono font-medium"
                                  >
                                    {tok.text}
                                  </button>
                                );
                              }
                              if (
                                tok.kind === 'syntax' &&
                                tok.refId &&
                                syntaxHintsEnabled &&
                                SYNTAX_DOCS[tok.refId] &&
                                language === 'python'
                              ) {
                                const syntaxDoc = SYNTAX_DOCS[tok.refId];
                                const isOpen =
                                  activePopover?.syntaxId === tok.refId &&
                                  activePopover?.lineIndex === lineIdx;
                                const isLiteral = LITERAL_SYNTAX_IDS.has(tok.refId);
                                return (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() =>
                                      setActivePopover(
                                        isOpen
                                          ? null
                                          : { syntaxId: tok.refId!, lineIndex: lineIdx }
                                      )
                                    }
                                    title={`${syntaxDoc.title} — нажмите для подсказки`}
                                    aria-expanded={isOpen}
                                    aria-label={`Подсказка Python: ${syntaxDoc.token}`}
                                    className={`code-syntax-token inline font-mono font-medium ${
                                      isLiteral
                                        ? 'text-[#b86b14] dark:text-[#e8a855]'
                                        : 'text-[#cf4434] dark:text-[#f07460]'
                                    } ${isOpen ? 'bg-[#cf4434]/15 dark:bg-[#f07460]/20' : ''}`}
                                  >
                                    {tok.text}
                                  </button>
                                );
                              }
                              if (tok.kind === 'syntax') {
                                const isLiteral = tok.refId && LITERAL_SYNTAX_IDS.has(tok.refId);
                                return (
                                  <span
                                    key={tIdx}
                                    className={
                                      isLiteral
                                        ? 'font-medium text-[#b86b14] dark:text-[#e8a855]'
                                        : 'font-medium text-[#cf4434] dark:text-[#f07460]'
                                    }
                                  >
                                    {tok.text}
                                  </span>
                                );
                              }
                              return <span key={tIdx}>{tok.text}</span>;
                            })}
                    </div>
                  </div>

                  {/* Smoothly animated inline syntax explanation anchored right below the clicked line */}
                  <AnimatePresence initial={false}>
                    {showPopoverHere && activeSyntaxDoc && (
                      <motion.div
                        key={`syntax-${activeSyntaxDoc.id}-${lineIdx}`}
                        initial={{ height: 0, opacity: 0, y: -4 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          role="region"
                          aria-label={`Объяснение конструкции ${activeSyntaxDoc.token}`}
                          className="my-2.5 max-w-full whitespace-normal rounded-[5px] border border-[#dcdcd4] bg-[#f7f7f3] p-3.5 font-sans text-[13px] text-[#111614] dark:border-white/15 dark:bg-[#191c1a] dark:text-[#ecece6]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-mono text-[12px] font-medium text-[#cf4434] dark:text-[#f07460]">
                              {activeSyntaxDoc.title}
                            </div>
                            <button
                              type="button"
                              onClick={() => setActivePopover(null)}
                              aria-label="Закрыть подсказку синтаксиса"
                              className="rounded-[3px] p-0.5 text-[#61655f] hover:bg-black/5 hover:text-[#111614] dark:text-[#8e938c] dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <p className="mt-1.5 leading-relaxed text-[#2e322f] dark:text-[#cfd2cc]">
                            {activeSyntaxDoc.shortSummary}
                          </p>
                          <p className="mt-1.5 text-[12px] italic text-[#61655f] dark:text-[#8e938c]">
                            Аналогия: {activeSyntaxDoc.analogy}
                          </p>
                          <pre className="mt-2 overflow-x-auto rounded-[4px] border border-[#e4e5df] bg-white/80 px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[#111614] dark:border-white/10 dark:bg-[#121413] dark:text-[#e8e8e2]">
                            {activeSyntaxDoc.miniExample}
                          </pre>
                          {onOpenGlossaryWithSyntax && (
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => onOpenGlossaryWithSyntax(activeSyntaxDoc.id)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#2e7d5b] underline underline-offset-4 hover:opacity-75 dark:text-[#4cb888]"
                              >
                                <BookOpen className="h-3 w-3" aria-hidden="true" />
                                <span>Открыть в словаре</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Quiet footer index of clickable functions */}
      {language === 'python' && clickableFunctions.length > 0 && onSelectFunction && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#ecece6] bg-[#fafaf7] px-3.5 py-2 font-mono text-[11px] dark:border-white/[0.06] dark:bg-[#181b1a]">
          <span className="text-[#61655f] dark:text-[#8e938c]">функции //</span>
          {clickableFunctions.map((fnId) => {
            const isSelected = activeFunctionId === fnId;
            return (
              <button
                key={fnId}
                type="button"
                onClick={() => onSelectFunction(fnId)}
                className={`rounded-[4px] px-1.5 py-0.5 transition-colors ${
                  isSelected
                    ? 'bg-[#2e7d5b] text-white dark:bg-[#4cb888] dark:text-[#0f1714]'
                    : 'text-[#1c3229] underline decoration-[#2e7d5b]/45 underline-offset-2 hover:bg-[#2e7d5b]/10 dark:text-[#dce8e1] dark:decoration-[#4cb888]/55'
                }`}
              >
                {fnId}()
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
