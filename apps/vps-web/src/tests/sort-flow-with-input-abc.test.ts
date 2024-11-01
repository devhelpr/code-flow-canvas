/**
 * @vitest-environment node
 **/
import { expect, test } from 'vitest';
import { flow } from './flows/sort-flow-with-input-abc';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('sort flow with input abc', () => {
  test('runs sort flow with string input', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run([
      'five',
      'four',
      'three',
      'two',
      'one',
    ]);
    console.log('result', result);
    expect(Array.isArray(result)).toBe(true);

    expect(result).toEqual(['five', 'four', 'one', 'three', 'two']);

    expect(result.length).toBe(5);
  });
});
