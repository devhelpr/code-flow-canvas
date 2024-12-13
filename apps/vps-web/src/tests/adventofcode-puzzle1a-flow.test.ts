/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/adventofcodepuzzle1a';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('adventofcodepuzzle1a flow', () => {
  test('runs adventofcodepuzzle1a flow', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes, flow.compositions);
    const result = await flowEngine.run();
    expect(result).toStrictEqual(11);
  });
});
