/**
 * @vitest-environment node
 **/
import { expect, test } from 'vitest';
import { flow } from './flows/sort-flow-with-input';
import { FlowEngine } from '../app/flow-engine/flow-engine';

describe('sort flow with input', () => {
  test('runs sort flow with input', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run([5, 4, 3, 2, 1]);
    console.log('result', result);
    expect(Array.isArray(result)).toBe(true);

    (result as unknown as any[]).forEach((item, index) => {
      if (index < result.length - 1) {
        expect(item <= result[index + 1]).toBe(true);
      }
    });

    expect(result.length).toBe(5);
  });
});
