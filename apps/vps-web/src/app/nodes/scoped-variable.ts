import {
  CanvasAppInstance,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  Rect,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/FormField';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { showDictionaryData } from './data-viewers/dictionary';
import { showArrayData } from './data-viewers/array';
import { showGridData, StructureInfo } from './data-viewers/grid';

export const scopeVariableNodeName = 'scope-variable';

export const getScopedVariable =
  (isGlobal = false) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let canvasAppInstance: CanvasAppInstance<NodeInfo>;
    let rect:
      | ReturnType<CanvasAppInstance<NodeInfo>['createRect']>
      | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let componentWrapper: IRectNodeComponent<NodeInfo>;
    let htmlNode: IElementNode<NodeInfo> | undefined = undefined;
    let tagNode: IElementNode<NodeInfo> | undefined = undefined;
    let variableName = '';
    let currentValue: any = 0;
    let timeout: any = undefined;

    let fieldType = 'value';
    let fieldValueType = 'number';
    let scopedData: Record<string, any> = {};

    const getDefaultValue = () => {
      switch (fieldValueType) {
        case 'number':
          return 0;
        case 'string':
          return '';
        case 'integer':
          return 0;
        case 'array':
          return [];
        default:
          return '';
      }
    };

    const convertDataToType = (data: any) => {
      switch (fieldValueType) {
        case 'number':
          return typeof data === 'number' ? data : parseFloat(data) || 0;
        case 'string':
          return data.toString();
        case 'integer':
          return parseInt(data) || 0;
        case 'array':
          return Array.isArray(data) ? data : [];
        default:
          return data.toString();
      }
    };

    const setDataForFieldType = (data: any, scopeId?: string) => {
      if (fieldType === 'value') {
        const value = convertDataToType(data);
        if (scopeId && !isGlobal) {
          scopedData[scopeId] = value;
        } else {
          currentValue = value;
        }
      } else if (fieldType === 'dictionary') {
        if (scopeId && !isGlobal) {
          if (!scopedData[scopeId]) {
            scopedData[scopeId] = {};
          }
        } else {
          if (!currentValue) {
            currentValue = {};
          }
        }
        if (data && data.key) {
          const value = convertDataToType(data.value);
          if (scopeId && !isGlobal) {
            scopedData[scopeId][data.key] = value;
          } else {
            currentValue[data.key] = value;
          }
        }
      } else if (fieldType === 'array') {
        if (scopeId && !isGlobal) {
          if (!scopedData[scopeId]) {
            scopedData[scopeId] = [];
          }
        } else {
          if (!currentValue) {
            currentValue = [];
          }
        }
        if (data) {
          if (scopeId && !isGlobal) {
            if (Array.isArray(data)) {
              scopedData[scopeId] = data;
            } else if (data && data.index !== undefined) {
              const value = convertDataToType(data.value);
              if (data.index < scopedData[scopeId].length) {
                if (
                  fieldValueType === 'array' &&
                  Array.isArray(scopedData[scopeId][data.index])
                ) {
                  // push raw value (fieldValueType is array)
                  scopedData[scopeId][data.index].push(data.value);
                } else {
                  scopedData[scopeId][data.index] = value;
                }
              }
            } else if (data.push) {
              // data needs to be pushed 'raw' without convertDataToType
              // .. convertDataToType converts to array when fieldValueType is array
              // .. and here you want to push a value to that array
              if (Array.isArray(data.push)) {
                scopedData[scopeId].push(...data.push);
              } else {
                scopedData[scopeId].push(data.push);
              }
            }
          } else {
            if (Array.isArray(data)) {
              currentValue = data;
            } else if (data && data.index !== undefined) {
              const value = convertDataToType(data.value);
              if (data.index < currentValue.length) {
                if (
                  fieldValueType === 'array' &&
                  Array.isArray(currentValue[data.index])
                ) {
                  // push raw value (fieldValueType is array)
                  currentValue[data.index].push(data.value);
                } else {
                  currentValue[data.index] = value;
                }
              }
            } else if (data.push) {
              // data needs to be pushed 'raw' without convertDataToType
              // .. convertDataToType converts to array when fieldValueType is array
              // .. and here you want to push a value to that array
              if (Array.isArray(data.push)) {
                currentValue.push(...data.push);
              } else {
                currentValue.push(data.push);
              }
            }
          }
        }
      } else if (fieldType === 'grid') {
        if (scopeId && !isGlobal) {
          if (!scopedData[scopeId]) {
            scopedData[scopeId] = {
              info: {
                rowCount: 0,
                columnsCount: 0,
              },
              data: [],
            };
          }
        } else {
          if (!currentValue) {
            currentValue = {
              info: {
                rowCount: 0,
                columnsCount: 0,
              },
              data: [],
            };
          }
        }
        if (data && data.setMode === 'fillRow') {
          let structureInfo = {
            rowCount: data.row,
            columnCount: data.array.length,
          };
          if (scopeId && !isGlobal) {
            structureInfo = scopedData[scopeId].info;
          } else {
            structureInfo = currentValue.info;
          }

          if (Array.isArray(data.array)) {
            const copyArray = [...data.array];
            if (data.array.length > structureInfo.columnCount) {
              copyArray.splice(structureInfo.columnCount);
            } else {
              if (data.array.length < structureInfo.columnCount) {
                for (
                  let i = data.array.length;
                  i < structureInfo.columnCount;
                  i++
                ) {
                  copyArray.push(getDefaultValue());
                }
              }
            }
            if (scopeId && !isGlobal) {
              scopedData[scopeId].data[data.row] = copyArray;
            } else {
              currentValue.data[data.row] = copyArray;
            }
          }
        } else if (
          data &&
          data.row !== undefined &&
          data.column !== undefined
        ) {
          const value = convertDataToType(data.value);
          if (scopeId && !isGlobal) {
            scopedData[scopeId].data[data.row][data.column] = value;
          } else {
            currentValue.data[data.row][data.column] = value;
          }
        }
      }
    };

    const getDataForFieldType = (parameter?: any, scopeId?: string) => {
      if (fieldType === 'value') {
        if (scopeId && !isGlobal) {
          return scopedData[scopeId];
        }
        return currentValue;
      } else if (fieldType === 'dictionary') {
        if (scopeId && !isGlobal) {
          if (parameter === undefined) {
            return scopedData[scopeId];
          }
          if (scopedData[scopeId]) {
            return scopedData[scopeId][parameter.toString()];
          }
          return getDefaultValue();
        }
        if (parameter === undefined) {
          return currentValue;
        }
        return currentValue?.[parameter.toString()];
      } else if (fieldType === 'array') {
        if (scopeId && !isGlobal) {
          if (parameter === undefined) {
            return scopedData[scopeId];
          }
          if (scopedData[scopeId]) {
            return scopedData[scopeId][parameter];
          }
          return getDefaultValue();
        }
        if (parameter === undefined) {
          return currentValue;
        }
        return currentValue?.[parameter];
      } else if (fieldType === 'grid') {
        if (scopeId && !isGlobal) {
          if (parameter === undefined) {
            return scopedData[scopeId];
          }
          if (
            scopedData[scopeId] &&
            parameter.row !== undefined &&
            parameter.column !== undefined
          ) {
            return scopedData[scopeId].data[parameter.row][parameter.column];
          }
          return getDefaultValue();
        }
        if (parameter === undefined) {
          return currentValue;
        }
        if (parameter.row !== undefined && parameter.column !== undefined) {
          return currentValue?.data?.[parameter.row]?.[parameter.column];
        }
        return getDefaultValue();
      }
    };
    function getLabel(description: string) {
      const variableScopeType = isGlobal ? 'global' : 'scope dependent';
      return `${description} (${variableScopeType})`;
    }
    const initializeCompute = () => {
      const variableName = node?.nodeInfo?.formValues?.['variableName'] ?? '';

      scopedData = {};
      currentValue = undefined;
      fieldType = node?.nodeInfo?.formValues?.['fieldType'] ?? 'value';
      fieldValueType =
        node?.nodeInfo?.formValues?.['fieldValueType'] ?? 'number';
      setDataForFieldType(
        fieldType === 'value'
          ? node?.nodeInfo?.formValues?.['initialValue'] ?? 0
          : undefined
      );

      if (fieldType === 'value') {
        if (isNaN(currentValue)) {
          currentValue = 0;
          if (htmlNode) {
            (htmlNode.domElement as unknown as HTMLElement).textContent = '-';
          }
        } else if (htmlNode) {
          (htmlNode.domElement as unknown as HTMLElement).textContent =
            getLabel(currentValue.toString());
        }
        canvasAppInstance?.setVariable(variableName, currentValue);
      } else if (fieldType === 'dictionary') {
        if (htmlNode) {
          (htmlNode.domElement as unknown as HTMLElement).textContent =
            getLabel('dictionary');
        }
      } else if (fieldType === 'array') {
        if (htmlNode) {
          (htmlNode.domElement as unknown as HTMLElement).textContent =
            getLabel('array');
        }
      } else if (fieldType === 'grid') {
        if (htmlNode) {
          (htmlNode.domElement as unknown as HTMLElement).textContent =
            getLabel('grid');
        }
      } else {
        if (htmlNode) {
          (
            htmlNode.domElement as unknown as HTMLElement
          ).textContent = `${fieldType} is not supported yet`;
        }
      }

      if (rect) {
        rect.resize(120);
      }

      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      (componentWrapper.domElement as unknown as HTMLElement).classList.remove(
        'border-green-200'
      );

      return;
    };

    const compute = (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number
    ) => {
      return {
        result: false,
        stop: true,
        followPath: undefined,
      };
    };

    const getData = (parameter?: any, scopeId?: string) => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      (componentWrapper.domElement as unknown as HTMLElement).classList.add(
        'border-orange-200'
      );
      timeout = setTimeout(() => {
        (
          componentWrapper?.domElement as unknown as HTMLElement
        ).classList.remove('border-orange-200');

        (
          componentWrapper?.domElement as unknown as HTMLElement
        ).classList.remove('border-green-200');
      }, 250);
      return getDataForFieldType(parameter, scopeId);
    };
    const setData = (data: any, scopeId?: string) => {
      setDataForFieldType(data, scopeId);

      const value = fieldType === 'value' ? data : data.value;
      if (htmlNode) {
        if (fieldType === 'dictionary') {
          const dictionary = getDataForFieldType(undefined, scopeId);
          if (dictionary) {
            showDictionaryData(dictionary, htmlNode, isGlobal);
            if (rect) {
              rect.resize(240);
            }
          }
        } else if (fieldType === 'array') {
          const array = getDataForFieldType(undefined, scopeId);
          if (array && Array.isArray(array)) {
            showArrayData(array, htmlNode, isGlobal);
            if (rect) {
              rect.resize(240);
            }
          }
        } else if (fieldType === 'grid') {
          const grid = getDataForFieldType(undefined, scopeId);
          if (grid && Array.isArray(grid.data)) {
            if (grid.data.length > 0) {
              showGridData(
                grid.data,
                {
                  rowCount: grid.data.length,
                  columnCount: grid.data[0].length,
                },
                htmlNode,
                isGlobal
              );
              if (rect) {
                rect.resize(grid.data[0].length * 32);
              }
            } else {
              (htmlNode.domElement as unknown as HTMLElement).textContent =
                'empty grid';
              if (rect) {
                rect.resize(120);
              }
            }
          }
        } else {
          (htmlNode.domElement as unknown as HTMLElement).textContent =
            getLabel(value.toString());

          if (rect) {
            rect.resize(120);
          }
        }
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        (componentWrapper.domElement as unknown as HTMLElement).classList.add(
          'border-green-200'
        );
        timeout = setTimeout(() => {
          (
            componentWrapper?.domElement as unknown as HTMLElement
          ).classList.remove('border-green-200');
          (
            componentWrapper?.domElement as unknown as HTMLElement
          ).classList.remove('border-orange-200');
        }, 250);
      }
    };
    const initializeDataStructure = (
      structureInfo: StructureInfo,
      scopeId?: string
    ) => {
      if (fieldType === 'grid') {
        if (
          structureInfo &&
          structureInfo.rowCount &&
          structureInfo.columnCount
        ) {
          const rowCount = structureInfo.rowCount;
          const columnCount = structureInfo.columnCount;
          if (rowCount > 0 && columnCount > 0) {
            const initialData = {
              info: {
                rowCount,
                columnCount,
              },
              data: [],
            };
            if (scopeId && !isGlobal) {
              scopedData[scopeId] = initialData;
              for (let i = 0; i < rowCount; i++) {
                scopedData[scopeId].data.push([]);
                for (let j = 0; j < columnCount; j++) {
                  scopedData[scopeId].data[i].push(getDefaultValue());
                }
              }
            } else {
              currentValue = initialData;
              for (let i = 0; i < rowCount; i++) {
                currentValue.data.push([]);
                for (let j = 0; j < columnCount; j++) {
                  currentValue.data[i].push(getDefaultValue());
                }
              }
            }
          }

          if (htmlNode && fieldType === 'grid') {
            const grid = getDataForFieldType(undefined, scopeId);
            if (grid && Array.isArray(grid.data)) {
              if (grid.data.length > 0) {
                showGridData(
                  grid.data,
                  {
                    rowCount: grid.data.length,
                    columnCount: grid.data[0].length,
                  },
                  htmlNode,
                  isGlobal
                );
                if (rect) {
                  rect.resize(grid.data[0].length * 32);
                }
              } else {
                (htmlNode.domElement as unknown as HTMLElement).textContent =
                  'empty grid';
                if (rect) {
                  rect.resize(120);
                }
              }
            }
          }
        }
      } else if (fieldType === 'array') {
        if (scopeId && !isGlobal) {
          scopedData[scopeId] = [];
        } else {
          currentValue = [];
        }
      }
    };
    const removeScope = (scopeId: string) => {
      if (scopeId && scopedData[scopeId]) {
        delete scopedData[scopeId];
      }
    };
    return {
      name: isGlobal ? 'variable' : scopeVariableNodeName,
      family: 'flow-canvas',
      isContainer: false,
      createVisualNode: (
        canvasApp: CanvasAppInstance<NodeInfo>,
        x: number,
        y: number,
        id?: string,
        initalValues?: InitialValues,
        containerNode?: IRectNodeComponent<NodeInfo>
      ) => {
        canvasAppInstance = canvasApp;
        variableName = initalValues?.['variableName'] ?? '';

        if (id) {
          canvasApp.registerVariable(variableName, {
            id: id,
            getData,
            setData,
            initializeDataStructure,
            removeScope,
          });
        }
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'variableName',
            value: initalValues?.['variableName'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                variableName: value,
              };
              canvasApp.unregisterVariable(variableName, node.id ?? '');
              variableName = value;
              (tagNode?.domElement as HTMLElement).textContent = variableName;
              canvasApp.registerVariable(variableName, {
                id: node.id ?? '',
                getData,
                setData,
                removeScope,
              });
              console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'initialValue',
            value: initalValues?.['initialValue'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                initialValue: value,
              };
              initializeCompute();
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Select,
            fieldName: 'fieldType',
            value: initalValues?.['fieldType'] ?? 'value',
            options: [
              {
                value: 'value',
                label: 'Value',
              },
              {
                value: 'dictionary',
                label: 'Dictionary',
              },
              {
                value: 'array',
                label: 'Array',
              },
              {
                value: 'grid',
                label: 'Grid/Matrix',
              },
              // {
              //   value: 'dataTable',
              //   label: 'DataTable',
              // },
            ],
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                fieldType: value,
              };
              fieldType = value;
              initializeCompute();
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Select,
            fieldName: 'fieldValueType',
            value: initalValues?.['fieldValueType'] ?? 'number',
            options: [
              {
                value: 'number',
                label: 'Number',
              },
              {
                value: 'string',
                label: 'String',
              },
              {
                value: 'array',
                label: 'Array',
              },
              /*{
              value: 'integer',
              label: 'Integer',
            },
            {
              value: 'decimal',
              label: 'Decimal',
            },
            {
              value: 'latlong',
              label: 'Latitude/Longitude',
            },
            {
              value: 'date',
              label: 'Date',
            },
            {
              value: 'time',
              label: 'Time',
            },
            { value: 'datetime', label: 'Date/Time' },
            { value: 'boolean', label: 'Boolean' },
            { value: 'color', label: 'Color' },
            { value: 'byte', label: 'Byte' },
            { value: 'word', label: 'Word(32bit)' },
            { value: 'dword', label: 'Double Word(64bit)' },
            { value: 'bigint', label: 'Bigint' },
            */
            ],
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                fieldValueType: value,
              };
              fieldValueType = value;
              initializeCompute();
              if (updated) {
                updated();
              }
            },
          },
        ];

        htmlNode = createElement(
          'div',
          {
            class: '',
          },
          undefined,
          '-'
        ) as unknown as INodeComponent<NodeInfo>;

        componentWrapper = createElement(
          'div',
          {
            class: `border-[4px] border-solid border-transparent transition duration-500 ease-in-out inner-node bg-slate-600 text-white p-4 rounded text-center`,
          },
          undefined,
          htmlNode.domElement as unknown as HTMLElement
        ) as unknown as IRectNodeComponent<NodeInfo>;

        rect = canvasApp.createRect(
          x,
          y,
          100,
          100,
          undefined,
          [],
          componentWrapper,
          {
            classNames: `p-4 rounded`,
          },
          undefined,
          undefined,
          undefined,
          id,
          {
            type: isGlobal ? 'variable' : scopeVariableNodeName,
            formValues: {
              variableName: variableName,
              initialValue: initalValues?.['initialValue'] ?? '',
              fieldType: initalValues?.['fieldType'] ?? 'value',
              fieldValueType: initalValues?.['fieldValueType'] ?? 'number',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        tagNode = createElement(
          'div',
          {
            class:
              'absolute top-0 left-0 bg-slate-700 text-white px-1 rounded -translate-y-2/4 translate-x-1',
          },
          rect.nodeComponent.domElement as unknown as HTMLElement,
          variableName
        ) as unknown as INodeComponent<NodeInfo>;

        node = rect.nodeComponent;

        if (node.nodeInfo) {
          node.nodeInfo.formElements = formElements;
          node.nodeInfo.isVariable = true;
          node.nodeInfo.compute = compute;
          node.nodeInfo.sendData = compute;
          node.nodeInfo.getData = getData;
          node.nodeInfo.initializeCompute = initializeCompute;
          node.nodeInfo.delete = () => {
            canvasApp.unregisterVariable(variableName, node.id ?? '');
            (
              componentWrapper?.domElement as unknown as HTMLElement
            ).classList.remove('border-green-200');
            if (timeout) {
              clearTimeout(timeout);
              timeout = undefined;
            }
          };
        }
        return node;
      },
    };
  };
