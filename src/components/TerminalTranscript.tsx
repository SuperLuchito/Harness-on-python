interface TerminalEntry {
  speaker: 'command' | 'system' | 'user' | 'model' | 'tool';
  text: string;
}

interface TerminalTranscriptProps {
  title?: string;
  assistantName: string;
  entries: TerminalEntry[];
}

export function TerminalTranscript({
  title = 'терминал',
  assistantName,
  entries,
}: TerminalTranscriptProps) {
  return (
    <div className="my-6 min-w-0 max-w-full overflow-hidden rounded-[6px] border border-[#dcdcd4] bg-[#ffffff] shadow-[0_2px_10px_rgba(17,22,20,0.04)] dark:border-white/[0.11] dark:bg-[#161918] dark:shadow-[0_4px_18px_rgba(0,0,0,0.34)]">
      <div className="flex items-center justify-between border-b border-[#e8e8e2] bg-[#f4f4ef] px-3.5 py-2 font-mono text-[11px] text-[#61655f] dark:border-white/[0.08] dark:bg-[#1c201e] dark:text-[#8e938c]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d7d8d1] dark:bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d7d8d1] dark:bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d7d8d1] dark:bg-white/15" />
          </span>
          <span className="truncate">{title}</span>
        </div>
        <span className="shrink-0 uppercase tracking-[0.05em]">вывод</span>
      </div>
      <div className="code-scroll min-w-0 max-w-full overflow-x-auto bg-[#ffffff] px-4 py-3.5 font-mono text-[13px] leading-[1.6] text-[#111614] space-y-2 dark:bg-[#161918] dark:text-[#eaeae4]">
        {entries.map((entry, idx) => {
          if (entry.speaker === 'command') {
            return (
              <div key={idx} className="text-[#111614] dark:text-[#ecece6]">
                <span className="select-none text-[#6a737d] dark:text-[#7e847c]">$ </span>
                <span>{entry.text}</span>
              </div>
            );
          }
          if (entry.speaker === 'system') {
            return (
              <div key={idx} className="text-[#61655f] dark:text-[#8e938c]">
                {entry.text}
              </div>
            );
          }
          if (entry.speaker === 'user') {
            return (
              <div key={idx} className="whitespace-pre-wrap break-words">
                <span className="font-medium text-[#2563eb] dark:text-[#7dd3fc]">Вы: </span>
                <span>{entry.text}</span>
              </div>
            );
          }
          if (entry.speaker === 'tool') {
            return (
              <div key={idx} className="whitespace-pre-wrap break-all">
                <span className="font-medium text-[#3d8b3d] dark:text-[#6cc56c]">tool: </span>
                <span className="text-[#2f6f2f] dark:text-[#8fd98f]">{entry.text}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="whitespace-pre-wrap break-words">
              <span className="font-medium text-[#c18401] dark:text-[#e5a93c]">
                {assistantName}:{' '}
              </span>
              <span>{entry.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
