/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/reduce-flow';
import { FlowEngine } from '../app/flow-engine/flow-engine';

describe('reduce flow', () => {
  test('runs reduce flow', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    expect(Array.isArray(result)).toBe(false);
    expect(result).toStrictEqual(19);
  });
});
