import { describe, it, expect, vi } from 'vitest';
import { transformJSON } from './transform-json';
import { b } from 'vitest/dist/suite-a18diDsI';

describe('transformJSON', () => {
  it('should transform an array of primitives', () => {
    const input = [1, 2, 3];
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should transform an array of objects', () => {
    const input = [{ a: 1 }, { b: 2 }];
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('should transform a nested array', () => {
    const input = [
      [1, 2],
      [3, 4],
    ];
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('should transform an object with primitives', () => {
    const input = { a: 1, b: 2 };
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should transform a nested object', () => {
    const input = { a: { b: 2 } };
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual({ a: { b: 2 } });
  });

  it('should handle mixed arrays and objects', () => {
    const input = { a: [1, { b: 2 }] };
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual({ a: [1, { b: 2 }] });
  });

  it('should handle empty arrays and objects', () => {
    const input = { a: [], b: {} };
    const result = transformJSON(input, undefined, 'root');
    expect(result).toEqual({ a: [], b: {} });
  });

  it('should transform an object with @set and payload', () => {
    const input = { '@set:test': 'from-payload' };
    const result = transformJSON(input, undefined, 'root', {
      'from-payload': 'hello payload',
    });
    expect((result as any)['test']).toBe('hello payload');
  });

  it('should transform an object with @set and payload', () => {
    const input = { '@set:test': 'input' };
    const result = transformJSON(input, undefined, 'root', {
      input: 'hello input',
    });
    expect((result as any)['test']).toBe('hello input');
  });

  it('should transform an object with @map and payload', () => {
    const input = {
      '@map': {
        '@comment': "this maps payload['payload-messages'] to messages",
        input: 'payload-messages',
        property: 'messages',
        map: {
          type: 'object',
          properties: {
            '@set:role': 'role',
            '@set:content': 'message',
            '@expression:calc': 'a + b',
          },
        },
      },
      '@pushTo:messages': {
        '@comment': 'this pushes a new message to messages',
        role: 'system',
        '@set:content': 'input',
      },
    };
    const result = transformJSON(input, undefined, 'root', {
      ['payload-messages']: [
        { role: 'admin', message: 'hello', a: 5, b: 8 },
        { role: 'user', message: 'world', a: 303, b: 606 },
      ],
      ['input']: 'hello test',
    });
    expect((result as any)['messages']).toEqual([
      { role: 'admin', content: 'hello', calc: 13 },
      { role: 'user', content: 'world', calc: 909 },
      { role: 'system', content: 'hello test' },
    ]);
  });

  it('should transform an object with @expression and payload', () => {
    const input = { '@expression:test': 'a + b' };
    const result = transformJSON(input, undefined, 'root', {
      a: 2,
      b: 3,
    });
    expect((result as any)['test']).toBe(5);
  });

  it('should transform an object with @serialize and payload', () => {
    const input = {
      '@serialize:test': {
        a: 'a',
        b: 'b',
        '@expression:calc': 'a + b',
        '@expression:array': '[a, b]',
        anobject: {
          hello: 'world',
          '@expression:calc': 'a + b',
        },
      },
    };
    const result = transformJSON(input, undefined, 'root', {
      a: 2,
      b: 3,
    });
    expect((result as any)['test']).toBe(
      JSON.stringify({
        a: 'a',
        b: 'b',
        calc: 5,
        array: '[2,3]',
        anobject: '{"hello":"world","calc":5}',
      })
    );
  });

  it('should transform a nested object with @serialize and payload', () => {
    const input = {
      role: 'assistant',
      function_call: [
        {
          id: 'get_current_weather',
          type: 'function',
          function: {
            name: 'get_current_weather',
            '@serialize:arguments': {
              '@set:location': 'tool',
              unit: 'celsius',
            },
          },
        },
      ],
    };
    const result = transformJSON(input, undefined, 'root', {
      tool: 'a_function',
    });
    expect(result as any).toStrictEqual({
      function_call: [
        {
          function: {
            name: 'get_current_weather',
            arguments: '{"location":"a_function","unit":"celsius"}',
          },
          id: 'get_current_weather',
          type: 'function',
        },
      ],
      role: 'assistant',
    });
  });
});
