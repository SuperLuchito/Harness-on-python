import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDER_ORDER } from '../data/providers';
import { buildGoatProxyCode, generateProviderCodeBundle } from './providerCodegen';

test('generates distinct valid provider code for all configured providers', () => {
  for (const id of PROVIDER_ORDER) {
    const bundle = generateProviderCodeBundle(id);
    assert.ok(bundle.providerSimpleCode.includes('def create_client():'));
    assert.ok(bundle.providerWithToolsCode.includes('def ask_model('));
    assert.ok(bundle.fullAgentCode.includes('def run_agent('));
    assert.ok(bundle.setupCommands.includes('pip install '));
  }
});

test('Command Code GOAT uses official provider base URL and env variable', () => {
  const bundle = generateProviderCodeBundle('command_code_goat', 'z-ai/glm-5.3-flash');
  assert.ok(bundle.providerSimpleCode.includes('https://api.commandcode.ai/provider/v1'));
  assert.ok(bundle.providerSimpleCode.includes('COMMAND_CODE_API_KEY'));
  assert.ok(bundle.providerWithToolsCode.includes('z-ai/glm-5.3-flash'));
});

test('Anthropic uses native anthropic SDK and tool_result protocol', () => {
  const bundle = generateProviderCodeBundle('anthropic');
  assert.ok(bundle.providerWithToolsCode.includes('from anthropic import Anthropic'));
  assert.ok(bundle.providerWithToolsCode.includes('"type": "tool_result"'));
  assert.ok(bundle.requirementsTxt.includes('anthropic'));
});

test('GOAT proxy code reflects custom virtual keys and daily limits', () => {
  const code = buildGoatProxyCode(
    [{ id: 'k1', label: 'Иван', token: 'ivan_secret_42', dailyLimit: 25 }],
    'deepseek/deepseek-v4.1-flash'
  );
  assert.ok(code.includes('"ivan_secret_42"'));
  assert.ok(code.includes('"daily_limit": 25'));
  assert.ok(code.includes('https://api.commandcode.ai/provider/v1'));
});

test('Locals provider targets 127.0.0.1:8321/v1 with local key fallback', () => {
  const bundle = generateProviderCodeBundle('locals');
  assert.ok(bundle.providerWithToolsCode.includes('http://127.0.0.1:8321/v1'));
  assert.ok(bundle.providerWithToolsCode.includes('locals/inkling-2-mini-mlx-nvfp4'));
  assert.ok(bundle.providerWithToolsCode.includes('"local"'));
});

