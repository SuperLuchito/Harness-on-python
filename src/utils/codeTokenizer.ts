import { FUNCTION_DOCS } from '../data/pythonGlossary';
import { CodeToken } from '../types/guide';

const FUNCTION_NAMES = new Set(Object.keys(FUNCTION_DOCS));

interface PatternRule {
  regex: RegExp;
  kind: 'function' | 'syntax';
  refId: string;
}

// Multi-token / compound constructs checked before single words
const COMPOUND_PATTERNS: PatternRule[] = [
  { regex: /^if __name__ == "__main__":/, kind: 'syntax', refId: 'main_guard' },
  { regex: /^while True\b/, kind: 'syntax', refId: 'while_true' },
  { regex: /^with open\b/, kind: 'syntax', refId: 'with_open' },
  { regex: /^os\.environ\.get\b/, kind: 'syntax', refId: 'os_environ_get' },
  { regex: /^os\.walk\b/, kind: 'syntax', refId: 'os_walk' },
  { regex: /^json\.(?:loads|dumps)\b/, kind: 'syntax', refId: 'json_loads_dumps' },
  { regex: /^\.append\b/, kind: 'syntax', refId: 'append' },
  { regex: /^\.get\b/, kind: 'syntax', refId: 'dict_get' },
];

const KEYWORD_MAP: Record<string, string> = {
  def: 'def',
  import: 'import',
  from: 'from',
  return: 'return',
  for: 'for',
  if: 'if',
  elif: 'elif',
  else: 'else',
  try: 'try',
  except: 'except',
  None: 'none',
  True: 'bool_true_false',
  False: 'bool_true_false',
  break: 'break',
  continue: 'continue',
  raise: 'raise',
  in: 'for',
  not: 'if',
  and: 'if',
  or: 'if',
  as: 'with_open',
  class: 'def',
  pass: 'def',
};

const PYTHON_BUILTINS = new Set([
  'print',
  'input',
  'len',
  'range',
  'open',
  'str',
  'int',
  'float',
  'bool',
  'dict',
  'list',
  'set',
  'tuple',
  'sorted',
  'enumerate',
  'isinstance',
  'ValueError',
  'KeyError',
  'FileNotFoundError',
  'Exception',
  'EOFError',
  'KeyboardInterrupt',
  'OpenAI',
  'Anthropic',
  'HTTPServer',
  'BaseHTTPRequestHandler',
  'Path',
]);

function splitComment(line: string, commentChar = '#'): { codePart: string; commentPart: string } {
  let inQuote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inQuote) {
      escaped = true;
      continue;
    }
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (commentChar === '#' && ch === '#') {
      return {
        codePart: line.slice(0, i),
        commentPart: line.slice(i),
      };
    } else if (commentChar === '//' && ch === '/' && line[i + 1] === '/') {
      return {
        codePart: line.slice(0, i),
        commentPart: line.slice(i),
      };
    }
  }

  return { codePart: line, commentPart: '' };
}

export function tokenizePythonLine(line: string): CodeToken[] {
  const { codePart, commentPart } = splitComment(line, '#');
  const tokens: CodeToken[] = [];
  let i = 0;

  const pushPlain = (text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === 'plain') {
      prev.text += text;
    } else {
      tokens.push({ text, kind: 'plain' });
    }
  };

  while (i < codePart.length) {
    const slice = codePart.slice(i);

    // 1. Check f-string prefix
    if ((slice.startsWith('f"') || slice.startsWith("f'")) && (i === 0 || !/[A-Za-z0-9_]/.test(codePart[i - 1]))) {
      const quote = slice[1];
      let end = i + 2;
      let escaped = false;
      while (end < codePart.length) {
        const ch = codePart[end];
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ text: 'f', kind: 'syntax', refId: 'fstring' });
      tokens.push({ text: codePart.slice(i + 1, end), kind: 'string' });
      i = end;
      continue;
    }

    // 2. Check normal or byte string literals (never tokenize syntax inside strings)
    const isBytePrefix =
      (slice.startsWith('b"') || slice.startsWith("b'")) && (i === 0 || !/[A-Za-z0-9_]/.test(codePart[i - 1]));
    if (slice[0] === '"' || slice[0] === "'" || isBytePrefix) {
      const quote = isBytePrefix ? slice[1] : slice[0];
      let end = i + (isBytePrefix ? 2 : 1);
      let escaped = false;
      while (end < codePart.length) {
        const ch = codePart[end];
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ text: codePart.slice(i, end), kind: 'string' });
      i = end;
      continue;
    }

    // 3. Compound syntax constructs
    let matchedCompound = false;
    for (const rule of COMPOUND_PATTERNS) {
      const m = slice.match(rule.regex);
      if (m) {
        const startsWord = /[A-Za-z_]/.test(m[0][0]);
        if (!startsWord || i === 0 || !/[A-Za-z0-9_.]/.test(codePart[i - 1])) {
          tokens.push({ text: m[0], kind: rule.kind, refId: rule.refId });
          i += m[0].length;
          matchedCompound = true;
          break;
        }
      }
    }
    if (matchedCompound) continue;

    // 4. Numbers
    const numMatch = slice.match(/^\b\d+(?:\.\d+)?\b/);
    if (numMatch && (i === 0 || !/[A-Za-z0-9_]/.test(codePart[i - 1]))) {
      tokens.push({ text: numMatch[0], kind: 'number' });
      i += numMatch[0].length;
      continue;
    }

    // 5. Identifiers: clickable functions, syntax keywords, builtins, constants, or methods
    const wordMatch = slice.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const prevChar = i > 0 ? codePart[i - 1] : '';
      const nextChar = codePart[i + word.length] ?? '';
      if (prevChar !== '.' && FUNCTION_NAMES.has(word)) {
        tokens.push({ text: word, kind: 'function', refId: word });
      } else if (prevChar !== '.' && KEYWORD_MAP[word]) {
        tokens.push({ text: word, kind: 'syntax', refId: KEYWORD_MAP[word] });
      } else if (prevChar !== '.' && PYTHON_BUILTINS.has(word)) {
        tokens.push({ text: word, kind: 'builtin' });
      } else if (prevChar !== '.' && /^[A-Z][A-Z0-9_]{2,}$/.test(word)) {
        tokens.push({ text: word, kind: 'constant' });
      } else if (prevChar === '.' && nextChar === '(') {
        tokens.push({ text: word, kind: 'property' });
      } else {
        pushPlain(word);
      }
      i += word.length;
      continue;
    }

    pushPlain(codePart[i]);
    i++;
  }

  if (commentPart) {
    tokens.push({ text: commentPart, kind: 'comment' });
  }

  return tokens;
}

const BASH_COMMANDS = new Set([
  'mkdir',
  'cd',
  'python',
  'python3',
  'pip',
  'source',
  'touch',
  'export',
  'echo',
  'uv',
  'uvx',
  'locals',
  'curl',
  'tail',
  'git',
  'cat',
  'ls',
  'set',
]);

export function tokenizeBashLine(line: string): CodeToken[] {
  const { codePart, commentPart } = splitComment(line, '#');
  const tokens: CodeToken[] = [];
  let i = 0;

  const pushPlain = (text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === 'plain') {
      prev.text += text;
    } else {
      tokens.push({ text, kind: 'plain' });
    }
  };

  while (i < codePart.length) {
    const slice = codePart.slice(i);

    // Strings
    if (slice[0] === '"' || slice[0] === "'") {
      const quote = slice[0];
      let end = i + 1;
      let escaped = false;
      while (end < codePart.length) {
        const ch = codePart[end];
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ text: codePart.slice(i, end), kind: 'string' });
      i = end;
      continue;
    }

    // URLs or git+https://
    const urlMatch = slice.match(/^(?:git\+)?https?:\/\/[^\s"'`]+/);
    if (urlMatch) {
      tokens.push({ text: urlMatch[0], kind: 'string' });
      i += urlMatch[0].length;
      continue;
    }

    // CLI flags like --max-context or -m
    const flagMatch = slice.match(/^--?[A-Za-z0-9][A-Za-z0-9-]*/);
    if (flagMatch && (i === 0 || /\s/.test(codePart[i - 1]))) {
      tokens.push({ text: flagMatch[0], kind: 'flag' });
      i += flagMatch[0].length;
      continue;
    }

    // Env assignments like LOCALS_TYPED_TOOLS=0
    const envMatch = slice.match(/^[A-Z][A-Z0-9_]{2,}(?==)/);
    if (envMatch && (i === 0 || /\s/.test(codePart[i - 1]))) {
      tokens.push({ text: envMatch[0], kind: 'constant' });
      i += envMatch[0].length;
      continue;
    }

    // Paths starting with ~/
    const pathMatch = slice.match(/^~\/[^\s"'`|]+/);
    if (pathMatch) {
      tokens.push({ text: pathMatch[0], kind: 'property' });
      i += pathMatch[0].length;
      continue;
    }

    // Numbers
    const numMatch = slice.match(/^\b\d+(?:\.\d+)?\b/);
    if (numMatch && (i === 0 || /[\s=:]/.test(codePart[i - 1]))) {
      tokens.push({ text: numMatch[0], kind: 'number' });
      i += numMatch[0].length;
      continue;
    }

    // Commands
    const wordMatch = slice.match(/^[A-Za-z_][A-Za-z0-9_-]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const prevTrim = codePart.slice(0, i).trimEnd();
      const isCmdPos =
        prevTrim === '' ||
        prevTrim === '$' ||
        prevTrim.endsWith('|') ||
        prevTrim.endsWith('&&') ||
        /[A-Z0-9_]+=\S+$/.test(prevTrim);
      if (isCmdPos && BASH_COMMANDS.has(word)) {
        tokens.push({ text: word, kind: 'syntax' });
      } else {
        pushPlain(word);
      }
      i += word.length;
      continue;
    }

    pushPlain(codePart[i]);
    i++;
  }

  if (commentPart) {
    tokens.push({ text: commentPart, kind: 'comment' });
  }

  return tokens;
}

export function tokenizeJsonLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  const pushPlain = (text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === 'plain') {
      prev.text += text;
    } else {
      tokens.push({ text, kind: 'plain' });
    }
  };

  while (i < line.length) {
    const slice = line.slice(i);

    // JSON key or string value
    if (slice[0] === '"') {
      let end = i + 1;
      let escaped = false;
      while (end < line.length) {
        const ch = line[end];
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          end++;
          break;
        }
        end++;
      }
      const rest = line.slice(end).trimStart();
      const isKey = rest.startsWith(':');
      tokens.push({ text: line.slice(i, end), kind: isKey ? 'property' : 'string' });
      i = end;
      continue;
    }

    // Booleans & null
    const litMatch = slice.match(/^(?:true|false|null)\b/);
    if (litMatch && (i === 0 || !/[A-Za-z0-9_]/.test(line[i - 1]))) {
      tokens.push({ text: litMatch[0], kind: 'constant' });
      i += litMatch[0].length;
      continue;
    }

    // Numbers
    const numMatch = slice.match(/^-?\d+(?:\.\d+)?\b/);
    if (numMatch && (i === 0 || !/[A-Za-z0-9_]/.test(line[i - 1]))) {
      tokens.push({ text: numMatch[0], kind: 'number' });
      i += numMatch[0].length;
      continue;
    }

    pushPlain(line[i]);
    i++;
  }

  return tokens;
}

const TS_KEYWORDS = new Set([
  'import',
  'from',
  'const',
  'let',
  'var',
  'await',
  'async',
  'for',
  'of',
  'new',
  'return',
  'if',
  'else',
  'true',
  'false',
  'null',
  'undefined',
]);

const TS_BUILTINS = new Set(['OpenAI', 'process', 'console', 'Promise', 'Error', 'JSON']);

export function tokenizeTsLine(line: string): CodeToken[] {
  const { codePart, commentPart } = splitComment(line, '//');
  const tokens: CodeToken[] = [];
  let i = 0;

  const pushPlain = (text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === 'plain') {
      prev.text += text;
    } else {
      tokens.push({ text, kind: 'plain' });
    }
  };

  while (i < codePart.length) {
    const slice = codePart.slice(i);

    if (slice[0] === '"' || slice[0] === "'" || slice[0] === '`') {
      const quote = slice[0];
      let end = i + 1;
      let escaped = false;
      while (end < codePart.length) {
        const ch = codePart[end];
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          end++;
          break;
        }
        end++;
      }
      tokens.push({ text: codePart.slice(i, end), kind: 'string' });
      i = end;
      continue;
    }

    const numMatch = slice.match(/^\b\d+(?:\.\d+)?\b/);
    if (numMatch && (i === 0 || !/[A-Za-z0-9_]/.test(codePart[i - 1]))) {
      tokens.push({ text: numMatch[0], kind: 'number' });
      i += numMatch[0].length;
      continue;
    }

    const wordMatch = slice.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const prevChar = i > 0 ? codePart[i - 1] : '';
      const nextChar = codePart[i + word.length] ?? '';
      if (prevChar !== '.' && TS_KEYWORDS.has(word)) {
        tokens.push({
          text: word,
          kind: word === 'true' || word === 'false' || word === 'null' ? 'constant' : 'syntax',
        });
      } else if (prevChar !== '.' && TS_BUILTINS.has(word)) {
        tokens.push({ text: word, kind: 'builtin' });
      } else if (prevChar === '.' && nextChar === '(') {
        tokens.push({ text: word, kind: 'property' });
      } else if (nextChar === ':') {
        tokens.push({ text: word, kind: 'property' });
      } else {
        pushPlain(word);
      }
      i += word.length;
      continue;
    }

    pushPlain(codePart[i]);
    i++;
  }

  if (commentPart) {
    tokens.push({ text: commentPart, kind: 'comment' });
  }

  return tokens;
}

export function extractClickableFunctions(code: string): string[] {
  const found = new Set<string>();
  for (const line of code.split('\n')) {
    for (const token of tokenizePythonLine(line)) {
      if (token.kind === 'function' && token.refId) {
        found.add(token.refId);
      }
    }
  }
  return Array.from(found);
}
