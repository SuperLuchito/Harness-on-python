import { useState } from 'react';
import { motion } from 'motion/react';
import { Download } from 'lucide-react';
import { PROVIDERS } from '../data/providers';
import { ProviderId } from '../types/guide';
import { ProviderCodeBundle } from '../utils/providerCodegen';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';

interface FullCodeBundleProps {
  providerId: ProviderId;
  bundle: ProviderCodeBundle;
  syntaxHintsEnabled: boolean;
  activeFunctionId: string | null;
  onSelectFunction: (fnId: string) => void;
  onOpenGlossaryWithSyntax: (syntaxId: string) => void;
}

type BundleTab = 'provider.py' | 'agent.py' | 'goat_proxy.py' | 'requirements.txt';

export function FullCodeBundle({
  providerId,
  bundle,
  syntaxHintsEnabled,
  activeFunctionId,
  onSelectFunction,
  onOpenGlossaryWithSyntax,
}: FullCodeBundleProps) {
  const [activeTab, setActiveTab] = useState<BundleTab>('provider.py');
  const cfg = PROVIDERS[providerId];

  const fileContents: Record<BundleTab, { code: string; language: 'python' | 'text'; note: string }> = {
    'provider.py': {
      code: bundle.providerWithToolsCode,
      language: 'python',
      note: `Слой подключения для ${cfg.shortName}. Хочешь сменить провайдера — правь только этот файл.`,
    },
    'agent.py': {
      code: bundle.fullAgentCode,
      language: 'python',
      note: 'Весь агент целиком: 3 инструмента (read_file, list_files, edit_file) и главный цикл.',
    },
    'goat_proxy.py': {
      code: bundle.goatProxyCode,
      language: 'python',
      note: 'Необязательный прокси-сервер, чтобы раздавать лимиты своей подписки GOAT другим.',
    },
    'requirements.txt': {
      code: bundle.requirementsTxt,
      language: 'text',
      note: 'Единственная зависимость для установки командой pip install -r requirements.txt.',
    },
  };

  const currentFile = fileContents[activeTab];

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="full-code"
      aria-labelledby="full-code-heading"
      className="scroll-mt-24 border-t border-[#e4e5df] pt-12 dark:border-white/[0.08]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
            ИСХОДНИКИ // ГОТОВЫЙ ПРОЕКТ
          </p>
          <h2
            id="full-code-heading"
            className="mt-2 text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]"
          >
            Все файлы проекта под {cfg.shortName}
          </h2>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleDownload}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[#2e7d5b]/45 bg-[#2e7d5b]/[0.08] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[#1c4a36] transition-colors hover:border-[#2e7d5b] hover:bg-[#2e7d5b] hover:text-white whitespace-nowrap dark:border-[#4cb888]/45 dark:bg-[#4cb888]/12 dark:text-[#a8e8ca] dark:hover:bg-[#4cb888] dark:hover:text-[#0f1714]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Скачать {activeTab}</span>
        </motion.button>
      </div>

      {/* File tabs */}
      <div
        role="tablist"
        aria-label="Файлы проекта"
        className="mt-5 flex flex-wrap gap-1.5"
      >
        {(Object.keys(fileContents) as BundleTab[]).map((tab) => {
          const isActive = tab === activeTab;
          return (
            <motion.button
              key={tab}
              type="button"
              role="tab"
              whileTap={{ scale: 0.97 }}
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[6px] border px-3 py-1.5 font-mono text-[12px] transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#2e7d5b]/70 bg-[#2e7d5b] text-white shadow-[0_1px_6px_rgba(46,125,91,0.22)] dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                  : 'border-[#e0e2dc] bg-white/75 text-[#424742] hover:border-[#2e7d5b]/45 hover:text-[#111614] dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-[#b6bab3] dark:hover:border-[#4cb888]/45'
              }`}
            >
              {tab}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-3 text-[13.5px] text-[#61655f] dark:text-[#8e938c]">{currentFile.note}</p>

      <InteractiveCodeBlock
        filename={activeTab}
        code={currentFile.code}
        language={currentFile.language}
        syntaxHintsEnabled={syntaxHintsEnabled}
        activeFunctionId={activeFunctionId}
        onSelectFunction={onSelectFunction}
        onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
      />
    </section>
  );
}
