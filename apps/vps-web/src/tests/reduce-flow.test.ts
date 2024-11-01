/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/reduce-flow';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('reduce flow', () => {
  test('runs reduce flow', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    expect(Array.isArray(result)).toBe(false);
    expect(result).toStrictEqual(19);
  });
});
