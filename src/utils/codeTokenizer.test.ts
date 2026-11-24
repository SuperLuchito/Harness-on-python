import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractClickableFunctions,
  tokenizeBashLine,
  tokenizeJsonLine,
  tokenizePythonLine,
  tokenizeTsLine,
} from './codeTokenizer';

test('tokenizes function definitions and syntax keywords accurately', () => {
  const tokens = tokenizePythonLine('def read_file(args):');
  assert.equal(tokens[0].kind, 'syntax');
  assert.equal(tokens[0].refId, 'def');
  const fnToken = tokens.find((t) => t.kind === 'function');
  assert.ok(fnToken);
  assert.equal(fnToken?.refId, 'read_file');
});

test('does not highlight keywords or function names inside strings or comments', () => {
  const tokens = tokenizePythonLine('x = "def read_file while True"  # if return edit_file');
  const fnTokens = tokens.filter((t) => t.kind === 'function');
  const syntaxTokens = tokens.filter((t) => t.kind === 'syntax');
  assert.equal(fnTokens.length, 0);
  assert.equal(syntaxTokens.length, 0);
  assert.ok(tokens.some((t) => t.kind === 'string' && t.text.includes('read_file')));
  assert.ok(tokens.some((t) => t.kind === 'comment' && t.text.includes('edit_file')));
});

test('recognizes compound Python constructs and f-strings', () => {
  const t1 = tokenizePythonLine('    while True:');
  assert.ok(t1.some((t) => t.kind === 'syntax' && t.refId === 'while_true'));

  const t2 = tokenizePythonLine('    with open(path, "r") as f:');
  assert.ok(t2.some((t) => t.kind === 'syntax' && t.refId === 'with_open'));

  const t3 = tokenizePythonLine('    print(f"Файл {path} готов")');
  assert.ok(t3.some((t) => t.kind === 'syntax' && t.refId === 'fstring'));

  const t4 = tokenizePythonLine('if __name__ == "__main__":');
  assert.ok(t4.some((t) => t.kind === 'syntax' && t.refId === 'main_guard'));
});

test('extractClickableFunctions returns deduplicated list of known functions', () => {
  const code = `
def run_agent(client, tools):
    text = get_user_message()
    reply = ask_model(client, [])
    execute_tool(tools, "read_file", {})
`;
  const fns = extractClickableFunctions(code);
  assert.deepEqual(fns, ['run_agent', 'get_user_message', 'ask_model', 'execute_tool']);
});

test('highlights Python constants, builtins, and numbers alongside bash/json/ts', () => {
  const py = tokenizePythonLine('MODEL_NAME = OpenAI(max_tokens=1024)');
  assert.ok(py.some((t) => t.kind === 'constant' && t.text === 'MODEL_NAME'));
  assert.ok(py.some((t) => t.kind === 'builtin' && t.text === 'OpenAI'));
  assert.ok(py.some((t) => t.kind === 'number' && t.text === '1024'));

  const bash = tokenizeBashLine('LOCALS_TYPED_TOOLS=0 locals start --max-context 65536');
  assert.ok(bash.some((t) => t.kind === 'constant' && t.text === 'LOCALS_TYPED_TOOLS'));
  assert.ok(bash.some((t) => t.kind === 'syntax' && t.text === 'locals'));
  assert.ok(bash.some((t) => t.kind === 'flag' && t.text === '--max-context'));
  assert.ok(bash.some((t) => t.kind === 'number' && t.text === '65536'));

  const json = tokenizeJsonLine('  "contextWindow": 65536,');
  assert.ok(json.some((t) => t.kind === 'property' && t.text === '"contextWindow"'));
  assert.ok(json.some((t) => t.kind === 'number' && t.text === '65536'));

  const ts = tokenizeTsLine('const client = new OpenAI({ baseURL: "http://127.0.0.1:8321/v1" });');
  assert.ok(ts.some((t) => t.kind === 'syntax' && t.text === 'const'));
  assert.ok(ts.some((t) => t.kind === 'builtin' && t.text === 'OpenAI'));
  assert.ok(ts.some((t) => t.kind === 'string'));
});
