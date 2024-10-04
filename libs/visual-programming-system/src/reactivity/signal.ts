export interface ISignalSubscription<T = string> {
  execute?: () => void;
  executeWithValue?: (value: T, signalName: string) => void;
  executeWithName?: (signalName: string) => void;
  dependencies?: Set<Set<ISignalSubscription>>;
}

export interface NamedSignal<T = string> {
  name: string;
  subscription: ISignalSubscription<T>;
}

let registeredEffect: undefined | (() => void) = undefined;
const effectStack: any[] = [];

function subscribe(
  runningEffect: ISignalSubscription,
  subscriptions: Set<ISignalSubscription>
) {
  subscriptions.add(runningEffect);
  runningEffect.dependencies?.add(subscriptions);
}

/**
 * @deprecated createSignal is deprecated, use createNamedSignal instead
 */
export const createSignal = <T>(value: T): [() => T, (v: T) => void] => {
  // if a createSignal is called within an effect ... then an infinite loop will occur
  // how to prevent this?

  const subscriptions = new Set<ISignalSubscription>();
  let internalValue: T = value;
  return [
    () => {
      const runningEffect = effectStack[effectStack.length - 1];
      if (runningEffect) {
        subscribe(runningEffect, subscriptions);
      }
      return internalValue;
    },
    (v: T) => {
      internalValue = v;
      for (const subscription of [...subscriptions]) {
        if (subscription.execute) {
          subscription.execute();
        }
      }
      return;
    },
  ];
};

/**
 * @deprecated createEffect is deprecated, use trackNamedSignal instead
 */
export const createEffect = (fn: () => void) => {
  const execute = () => {
    cleanupEffectsDependencies(runningEffect);
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

export interface ISignal<T = string> {
  getValue: () => T;
  setValue: (v: T) => void;
  name: string;
}
const namedSubscriptions = new Map<string, NamedSignal[]>();
const registeredSignals = new Set<string>();
export const createNamedSignal = <T = string>(name: string): ISignal<T> => {
  let value: T;
  if (registeredSignals.has(name)) {
    throw new Error(`Signal with name ${name} already exists`);
  }
  registeredSignals.add(name);
  return {
    getValue: () => value,
    setValue: (v: T) => {
      value = v;
      updateNamedSignal<T>(name, value);
    },
    name,
  };
};

function subscribeByName<T = string>(
  name: string,
  subscription: ISignalSubscription<T>
) {
  if (!namedSubscriptions.has(name)) {
    namedSubscriptions.set(name, []);
  }
  const namedSubscription = namedSubscriptions.get(name);
  namedSubscription?.push({
    name,
    subscription: subscription as ISignalSubscription<string>,
  });
  if (namedSubscription) {
    namedSubscriptions.set(name, namedSubscription);
  }
}

export const trackNamedSignal = <T = string>(
  name: string,
  tracker: (value: T, signalName: string) => void
) => {
  subscribeByName<T>(name, {
    executeWithValue: tracker,
  });
};

export const trackNamedSignals = <T = string>(
  names: string[],
  tracker: (signalName: string) => void
) => {
  names.forEach((name) => {
    subscribeByName<T>(name, {
      executeWithName: tracker,
    });
  });
};

export const destroyNamedSignal = (name: string) => {
  namedSubscriptions.delete(name);
};

function cleanupEffectsDependencies(runningEffect: ISignalSubscription) {
  if (!runningEffect.dependencies) {
    return;
  }
  for (const dependency of runningEffect.dependencies) {
    dependency.delete(runningEffect);
  }
  runningEffect.dependencies.clear();
}

export const updateNamedSignal = <T = string>(name: string, value: T) => {
  const subscribtions = (
    namedSubscriptions as Map<string, NamedSignal<T>[]>
  ).get(name);
  subscribtions?.forEach((s) => {
    if (s.name === name) {
      s.subscription.executeWithValue?.(value, name);
      s.subscription.executeWithName?.(name);
    }
  });
};
