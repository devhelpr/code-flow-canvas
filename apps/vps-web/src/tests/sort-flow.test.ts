/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/sort-flow';
import { FlowEngine } from '../app/flow-engine/flow-engine';

describe('sort flow', () => {
  test('runs sort flow', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    console.log('result', result);
    expect(Array.isArray(result)).toBe(true);

    (result as unknown as any[]).forEach((item, index) => {
      if (index < result.length - 1) {
        expect(item <= result[index + 1]).toBe(true);
      }
    });

    expect(result.length).toBe(10);
  });
});
