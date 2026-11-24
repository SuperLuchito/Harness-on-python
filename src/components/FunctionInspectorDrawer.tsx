import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { FUNCTION_DOCS } from '../data/pythonGlossary';

interface FunctionInspectorDrawerProps {
  functionId: string | null;
  onClose: () => void;
  onSelectFunction: (fnId: string) => void;
}

export function FunctionInspectorDrawer({
  functionId,
  onClose,
  onSelectFunction,
}: FunctionInspectorDrawerProps) {
  const doc = functionId ? FUNCTION_DOCS[functionId] : null;

  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc, onClose]);

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          key="fn-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fn-inspector-title"
          onClick={onClose}
        >
          <motion.aside
            key="fn-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-full max-w-lg flex-col border-l border-[#dcdcd4] bg-[#f7f7f3] shadow-2xl dark:border-white/10 dark:bg-[#121413]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#e4e5df] px-6 py-5 dark:border-white/[0.08]">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                  РАЗБОР ФУНКЦИИ // {doc.file}
                </div>
                <h2
                  id="fn-inspector-title"
                  className="mt-1.5 font-mono text-[20px] font-medium text-[#f34f3f] dark:text-[#ff6b5b]"
                >
                  {doc.name}()
                </h2>
                <p className="mt-1 text-[14px] leading-snug text-[#3a3e3b] dark:text-[#b9bdb6]">
                  {doc.oneLiner}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть разбор функции"
                className="rounded-[4px] p-1.5 text-[#61655f] transition-colors hover:bg-black/5 hover:text-[#111614] dark:text-[#8e938c] dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body with smooth transition when switching related functions */}
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="code-scroll flex-1 space-y-6 overflow-y-auto px-6 py-6"
            >
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
              СИГНАТУРА
            </p>
            <pre className="mt-2 overflow-x-auto rounded-[4px] border border-[#e4e5df] bg-white/60 px-3.5 py-2.5 font-mono text-[12.5px] text-[#111614] dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-[#ecece6]">
              {doc.signature}
            </pre>
          </div>

          <div>
            <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
              Что делает
            </h3>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-[#3a3e3b] dark:text-[#c7cac3]">
              {doc.whatItDoes}
            </p>
          </div>

          <div className="rounded-[4px] border border-[#e4e5df] bg-white/55 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <h3 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#f34f3f] dark:text-[#ff6b5b]">
              ЗАЧЕМ ОНА НУЖНА АГЕНТУ
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-[1.58] text-[#2e322f] dark:text-[#cfd2cc]">
              {doc.whyAgentNeedsIt}
            </p>
          </div>

          {/* Parameters */}
          <div>
            <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
              Входные параметры
            </h3>
            {doc.params.length === 0 ? (
              <p className="mt-1.5 text-[13.5px] text-[#61655f] dark:text-[#8e938c]">
                Параметров нет — функция берёт всё необходимое из окружения или терминала.
              </p>
            ) : (
              <dl className="mt-2 divide-y divide-[#ecece6] rounded-[4px] border border-[#e4e5df] bg-white/55 dark:divide-white/[0.06] dark:border-white/[0.08] dark:bg-white/[0.03]">
                {doc.params.map((p) => (
                  <div key={p.name} className="px-3.5 py-3">
                    <dt className="flex items-baseline gap-2">
                      <span className="font-mono text-[12.5px] font-medium text-[#111614] dark:text-[#ecece6]">
                        {p.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#8a6d3b] dark:text-[#b89c66]">
                        {p.typeLabel}
                      </span>
                    </dt>
                    <dd className="mt-1 text-[12.5px] leading-relaxed text-[#4a4e49] dark:text-[#b2b6af]">
                      {p.description}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Return value */}
          <div>
            <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
              Что возвращает
            </h3>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-[#3a3e3b] dark:text-[#c7cac3]">
              {doc.returns}
            </p>
          </div>

          {/* Methods used */}
          <div>
            <h3 className="text-[14px] font-medium text-[#111614] dark:text-[#ecece6]">
              Используемые методы
            </h3>
            <ul className="mt-2 space-y-2">
              {doc.methodsUsed.map((m) => (
                <li
                  key={m.name}
                  className="rounded-[4px] border border-[#e4e5df] bg-white/55 px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <div className="font-mono text-[12px] font-medium text-[#3d8b3d] dark:text-[#6cc56c]">
                    {m.name}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#4a4e49] dark:text-[#b2b6af]">
                    {m.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Related */}
          {doc.relatedFunctions.length > 0 && (
            <div className="border-t border-[#e4e5df] pt-5 dark:border-white/[0.08]">
              <h3 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                СВЯЗАННЫЕ ФУНКЦИИ
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {doc.relatedFunctions.map((relId) => (
                  <button
                    key={relId}
                    type="button"
                    onClick={() => onSelectFunction(relId)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-[#dcdcd4] bg-white/60 px-2.5 py-1.5 font-mono text-[12px] text-[#111614] transition-colors hover:border-[#111614] dark:border-white/15 dark:bg-white/[0.04] dark:text-[#ecece6] dark:hover:border-white/40"
                  >
                    <span>{relId}()</span>
                    <ArrowUpRight className="h-3 w-3 text-[#f34f3f] dark:text-[#ff6b5b]" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}
            </motion.div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
