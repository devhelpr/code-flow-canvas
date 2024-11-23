/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/sort-200-items-flow';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('sort flow', () => {
  test('runs sort flow', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    console.log('result', result);
    expect(Array.isArray(result)).toBe(true);

    (result as unknown as any[]).forEach((item, index) => {
      if (index < result.length - 1) {
        expect(item <= result[index + 1]).toBe(true);
      }
    });

    expect(result.length).toBe(200);
  });
});
