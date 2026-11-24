export type ProviderId =
  | 'command_code_goat'
  | 'goat_shared_proxy'
  | 'locals'
  | 'openai_compatible'
  | 'anthropic'
  | 'gemini';

export interface ProviderModelOption {
  id: string;
  label: string;
  note: string;
}

export interface ProviderConfig {
  id: ProviderId;
  shortName: string;
  title: string;
  subtitle: string;
  authType: 'subscription' | 'proxy' | 'local' | 'api_key';
  authLabel: string;
  pipPackage: string;
  envVar: string;
  envPlaceholder: string;
  baseUrl: string | null;
  protocol: 'openai_compat' | 'anthropic_native';
  models: ProviderModelOption[];
  defaultModel: string;
  assistantDisplayName: string;
  setupSummary: string;
  keyHowTo: string;
  extensibilityNote: string;
}

export interface FunctionParamDoc {
  name: string;
  typeLabel: string;
  description: string;
}

export interface FunctionMethodUsed {
  name: string;
  description: string;
}

export interface FunctionDoc {
  id: string;
  name: string;
  file: string;
  signature: string;
  oneLiner: string;
  whatItDoes: string;
  whyAgentNeedsIt: string;
  params: FunctionParamDoc[];
  returns: string;
  methodsUsed: FunctionMethodUsed[];
  relatedFunctions: string[];
}

export type SyntaxCategory = 'basics' | 'control_flow' | 'data' | 'files_json' | 'modules';

export interface SyntaxDoc {
  id: string;
  token: string;
  title: string;
  category: SyntaxCategory;
  shortSummary: string;
  analogy: string;
  miniExample: string;
}

export type CodeTokenKind =
  | 'function'
  | 'syntax'
  | 'comment'
  | 'string'
  | 'number'
  | 'builtin'
  | 'constant'
  | 'property'
  | 'flag'
  | 'plain';

export interface CodeToken {
  text: string;
  kind: CodeTokenKind;
  refId?: string;
}

export interface VirtualKeyEntry {
  id: string;
  label: string;
  token: string;
  dailyLimit: number;
}

export type SimulatorScenarioId = 'riddle' | 'fizzbuzz' | 'rot13';

export type SimulatorNode = 'user' | 'loop' | 'provider' | 'tools';

export interface VirtualFile {
  name: string;
  content: string;
  status: 'existing' | 'read' | 'created' | 'edited';
}

export interface SimulatorStep {
  index: number;
  title: string;
  activeNode: SimulatorNode;
  activeFunction: string;
  explanation: string;
  conversationCount: number;
  payloadPreview: string;
  terminalLines: Array<{
    speaker: 'user' | 'model' | 'tool' | 'system';
    text: string;
  }>;
  files: VirtualFile[];
}
