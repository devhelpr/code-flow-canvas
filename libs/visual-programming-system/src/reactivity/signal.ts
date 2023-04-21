export interface ISignalSubscription {
  execute: () => void;
  dependencies: Set<Set<ISignalSubscription>>;
}

let registeredEffect: undefined | (() => void) = undefined;
const effectStack: any[] = [];

function subscribe(
  runningEffect: ISignalSubscription,
  subscriptions: Set<ISignalSubscription>
) {
  subscriptions.add(runningEffect);
  runningEffect.dependencies.add(subscriptions);
}

export const createSignal = <T>(value: T): [() => T, (v: T) => void] => {
  const subscriptions = new Set<ISignalSubscription>();
  let internalValue: T = value;
  if (registeredEffect) {
    registeredEffect();
  }
  return [
    () => {
      // read/getter/accessor implementation for signal
      const runningEffect = effectStack[effectStack.length - 1];
      // if there's an effect on the the top of the stack, subscribe it to the signal
      if (runningEffect) {
        subscribe(runningEffect, subscriptions);
      }
      return internalValue;
    },
    (v: T) => {
      // write/setter implementation for signal
      internalValue = v;
      for (const subscription of [...subscriptions]) {
        // execute the effect
        subscription.execute();
      }
      return;
    },
  ];
};

function cleanupEffectsDependencies(runningEffect: ISignalSubscription) {
  for (const dependency of runningEffect.dependencies) {
    dependency.delete(runningEffect);
  }
  runningEffect.dependencies.clear();
}

export const createEffect = (fn: () => void) => {
  const execute = () => {
    cleanupEffectsDependencies(runningEffect);
    //console.log('execute', runningEffect);
    effectStack.push(runningEffect);
    try {
      fn();
    } finally {
      effectStack.pop();
    }
  };
  const runningEffect: ISignalSubscription = {
    execute,
    dependencies: new Set(),
  };

  if (!registeredEffect) {
    registeredEffect = fn;
  }
  execute();
};
