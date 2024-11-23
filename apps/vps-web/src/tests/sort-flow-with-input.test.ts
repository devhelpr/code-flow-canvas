/**
 * @vitest-environment node
 **/
import { expect, test } from 'vitest';
import { flow } from './flows/sort-flow-with-input';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('sort flow with input', () => {
  test('runs sort flow with input', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run([0, 5, 4, 3, 2, 1, 0]);
    console.log('result', result);
    expect(Array.isArray(result)).toBe(true);

    (result as unknown as any[]).forEach((item, index) => {
      if (index < result.length - 1) {
        expect(item <= result[index + 1]).toBe(true);
      }
    });

    expect(result.length).toBe(7);
  });
});
