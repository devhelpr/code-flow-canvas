import { Flow, BaseNodeInfo } from '@devhelpr/visual-programming-system';
import { StorageProvider } from './StorageProvider';
import { NodeInfo } from '@devhelpr/web-flow-executor';

interface ITransaction {
  flowId: string;
  flow: Flow<NodeInfo>;
  name: string;
}

let isProcessing = false;
const transactions: ITransaction[] = [];

function storeTransaction(
  store: IDBObjectStore,
  transaction: ITransaction,
  ready: () => void,
  failed: () => void
) {
  try {
    const objectRequest = store.put(
      {
        flow: transaction?.flow,
        flowId: transaction?.flowId,
        name: transaction?.name,
      },
      transaction?.flowId
    );

    objectRequest.onerror = function (event) {
      console.log('handleTransactions error', event);
    };

    objectRequest.onsuccess = function (event) {
      if (objectRequest.result) {
        isProcessing = false;
        handleTransactions(ready, failed);
      } else {
        console.error('handleTransactions error in  onsuccess', event);
      }
    };
  } catch (error) {
    console.error('storeTransaction error', error);
    console.error('storeTransaction failed', transaction?.flow);
    failed();
  }
}

function handleTransactions(ready: () => void, failed: () => void) {
  console.log(
    `handleTransactions isProcessing: ${isProcessing} transaction queue length: ${transactions.length}`
  );

  if (!isProcessing && database) {
    if (transactions.length > 0) {
      isProcessing = true;
      const transaction = transactions.shift();
      if (!transaction) {
        isProcessing = false;
        console.log('No transaction in handleTransactions');
        handleTransactions(ready, failed);
        return;
      }
      const tx = database.transaction([flowStoreName], 'readwrite');
      const store = tx.objectStore(flowStoreName);

      const getRequest = store.get(transaction?.flowId);

      getRequest.onerror = function (_event) {
        failed();
      };

      getRequest.onsuccess = function (_event) {
        if (getRequest.result) {
          transaction.name = getRequest.result.name;
        }
        storeTransaction(store, transaction, ready, failed);
      };
    } else {
      ready();
    }
  }
}

function saveFlow<T extends BaseNodeInfo>(flowId: string, flow: Flow<T>) {
  currentFlow = flow;
  return new Promise<void>((resolve, reject) => {
    console.log('Saving flow', flowId, flow);

    transactions.push({
      flowId,
      flow,
      name: `Flow ${flowId}`,
    });
    console.log('Saving flow transactions', transactions);
    handleTransactions(
      () => {
        console.log('handleTransactions succeeded in saveFlow');
        resolve();
      },
      () => {
        console.log('handleTransactions failed in saveFlow');
        reject();
      }
    );
  });
}

function getFlow<T extends BaseNodeInfo>(
  flowId: string,
  defaultFlow?: Flow<T>
) {
  return new Promise<{ flow: Flow<T>; didNotExist: boolean }>(
    (resolve, reject) => {
      if (!database) {
        reject('No database');
        return;
      }

      const transaction = database.transaction([flowStoreName]);
      const objectStore = transaction.objectStore(flowStoreName);
      const objectRequest = objectStore.get(flowId);

      objectRequest.onerror = function (_event) {
        reject(Error('Error text'));
      };

      objectRequest.onsuccess = function (_event) {
        if (objectRequest.result) {
          currentFlow = objectRequest.result.flow as unknown as Flow<T>;
          console.log('getFlow succeeded', flowId, currentFlow);
          resolve({
            flow: objectRequest.result.flow as unknown as Flow<T>,
            didNotExist: false,
          });
        } else {
          // als niet gevonden, dan komt ie hier !!!
          // .. didNotExist: true !!!
          resolve({
            flow: defaultFlow ?? {
              schemaType: '',
              schemaVersion: '',
              id: '',
              flows: {
                flow: {
                  flowType: '',
                  nodes: [],
                },
              },
              compositions: {},
            },
            didNotExist: true,
          });
          //reject(Error('object not found'));
          return;
        }
      };
    }
  );
}

let database: IDBDatabase | null = null;

const flowStoreDBName = 'flowrunner-flow-store';
const flowStoreName = 'flowStore';
let currentFlow: undefined | Flow<BaseNodeInfo> = undefined;

export const createIndexedDBStorageProvider = <T extends BaseNodeInfo>() => {
  return new Promise<StorageProvider<T>>((resolve, reject) => {
    const idb = window.indexedDB;

    const dbRequest = idb.open(flowStoreDBName, 1);

    if (!dbRequest) {
      reject(new Error('createIndexedDBStorageProvider failed'));
    }

    dbRequest.onupgradeneeded = function (event) {
      if (!event || !event.target || !(event.target as any).result) {
        reject(new Error('No event target'));
      }

      database = (event.target as any).result as IDBDatabase;
      database.createObjectStore(flowStoreName, {
        autoIncrement: true,
      });
    };

    dbRequest.onsuccess = (event) => {
      if (!event || !event.target || !(event.target as any).result) {
        reject(new Error('No event target'));
      }
      database = (event.target as any).result as IDBDatabase;

      resolve({
        getFlow: getFlow<T>,
        saveFlow: saveFlow<T>,
        getCurrentFlow: (): Flow<T> => {
          return currentFlow as unknown as Flow<T>;
        },
      });
    };

    dbRequest.onerror = (_event) => {
      reject();
    };
  });
};
