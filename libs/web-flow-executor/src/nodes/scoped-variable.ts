import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FormFieldType,
  IElementNode,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  getFormattedVariableValue,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { showDictionaryData } from './data-viewers/dictionary';
import { showArrayData } from './data-viewers/array';
import { showGridData, StructureInfo } from './data-viewers/grid';

export const scopeVariableNodeName = 'scope-variable';
type FieldTypes = 'value' | 'dictionary' | 'array' | 'grid' | 'enum';

const borderErrorColor = 'border-red-500';
export const getScopedVariable =
  (isGlobal = false) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let canvasAppInstance: IFlowCanvasBase<NodeInfo>;
    let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
      undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let componentWrapper: IRectNodeComponent<NodeInfo>;
    let htmlNode: IElementNode<NodeInfo> | undefined = undefined;
    let tagNode: IElementNode<NodeInfo> | undefined = undefined;
    let variableName = '';
    let currentValue: any = 0;
    let timeout: any = undefined;

    let fieldType: FieldTypes = 'value';
    let fieldValueType = 'number';
    let scopedData: Record<string, any> = {};

    let lastStoredDataState: any = undefined;

    const getDefaultFieldValue = () => {
      switch (fieldType) {
        case 'value':
          return getDefaultValue();
        case 'enum':
          return getDefaultValue();
        case 'array':
          return [];
        case 'grid':
          return {};
        default:
          return '';
      }
    };

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
        case 'object':
          return {};
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
        case 'object':
          return typeof data === 'object' && !Array.isArray(data) ? data : {};
        default:
          return data.toString();
      }
    };

    const setDataForFieldType = (data: any, scopeId?: string) => {
      let result = true;
      if (fieldType === 'value') {
        const value = convertDataToType(data);
        if (scopeId && !isGlobal) {
          scopedData[scopeId] = value;
        } else {
          currentValue = value;
        }
      } else if (fieldType === 'enum') {
        const value = data.toString();
        const enumValues = node?.nodeInfo?.formValues?.['enumValues'] ?? [];
        if (enumValues.find((item: any) => item.value === value)) {
          if (scopeId && !isGlobal) {
            scopedData[scopeId] = value;
          } else {
            currentValue = value;
          }
        } else {
          result = false;
          if (scopeId && !isGlobal) {
            scopedData[scopeId] = '';
          } else {
            currentValue = '';
          }
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
        if (data === 0) {
          if (scopeId && !isGlobal) {
            scopedData[scopeId] = [];
          } else {
            currentValue = [];
          }
        } else if (data) {
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
            } else if (data.push !== undefined && data.push !== null) {
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
            } else if (data.push !== undefined && data.push !== null) {
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
      return result;
    };

    const getDataForFieldType = (parameter?: any, scopeId?: string) => {
      if (fieldType === 'value') {
        if (scopeId && !isGlobal) {
          return scopedData[scopeId];
        }
        return currentValue;
      } else if (fieldType === 'enum') {
        if (scopeId && !isGlobal) {
          return scopedData[scopeId];
        }
        return (
          (currentValue || node?.nodeInfo?.formValues?.['initialEnumValue']) ??
          ''
        );
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

    function getLabelAsHtml(description: string) {
      const variableScopeType = isGlobal ? 'global' : 'scope dependent';
      return `${description}<br />(${variableScopeType})`;
    }
    const initializeCompute = () => {
      const variableName = node?.nodeInfo?.formValues?.['variableName'] ?? '';
      lastStoredDataState = undefined;

      scopedData = {};
      currentValue = undefined;
      fieldType = node?.nodeInfo?.formValues?.['fieldType'] ?? 'value';
      fieldValueType =
        node?.nodeInfo?.formValues?.['fieldValueType'] ?? 'number';
      if (fieldType === 'enum') {
        setDataForFieldType(
          node?.nodeInfo?.formValues?.['initialEnumValue'] ?? ''
        );
      } else {
        setDataForFieldType(
          fieldType === 'value'
            ? node?.nodeInfo?.formValues?.['initialValue'] ?? 0
            : undefined
        );
      }

      if (canvasAppInstance?.isContextOnly) {
        return;
      }

      if (fieldType === 'value') {
        // if (isNaN(currentValue)) {
        //   currentValue = 0;
        //   if (htmlNode && htmlNode?.domElement) {
        //     (htmlNode.domElement as unknown as HTMLElement).textContent = '-';
        //   }
        // } else

        if (htmlNode && htmlNode?.domElement) {
          (htmlNode.domElement as unknown as HTMLElement).innerHTML =
            getLabelAsHtml(getFormattedVariableValue(currentValue, 2, ''));
        }
        canvasAppInstance?.setVariable(
          variableName,
          currentValue,
          undefined,
          undefined,
          true
        );
      } else if (fieldType === 'dictionary') {
        if (htmlNode && htmlNode?.domElement) {
          (htmlNode.domElement as unknown as HTMLElement).innerHTML =
            getLabelAsHtml('dictionary');
        }
      } else if (fieldType === 'array') {
        if (htmlNode && htmlNode?.domElement) {
          (htmlNode.domElement as unknown as HTMLElement).innerHTML =
            getLabelAsHtml('array');
        }
      } else if (fieldType === 'grid') {
        if (htmlNode && htmlNode?.domElement) {
          (htmlNode.domElement as unknown as HTMLElement).innerHTML =
            getLabelAsHtml('grid');
        }
      } else if (fieldType === 'enum') {
        if (htmlNode && htmlNode?.domElement) {
          (htmlNode.domElement as unknown as HTMLElement).innerHTML =
            getLabelAsHtml('enum');
        }
      } else {
        if (htmlNode && htmlNode?.domElement) {
          (
            htmlNode.domElement as unknown as HTMLElement
          ).textContent = `${fieldType} is not supported yet`;
        }
      }

      if (rect && rect.resize) {
        rect.resize(120);
      }

      if (!canvasAppInstance?.isContextOnly) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        (
          componentWrapper?.domElement as unknown as HTMLElement
        )?.classList?.remove('border-white');
        (
          componentWrapper?.domElement as unknown as HTMLElement
        )?.classList?.add('border-transparent');
      }

      return;
    };

    const compute = () => {
      return {
        result: false,
        stop: true,
        followPath: undefined,
      };
    };

    const getData = (parameter?: any, scopeId?: string) => {
      return getDataForFieldType(parameter, scopeId);
    };
    const resetVariable = (scopeId?: string) => {
      return setData(getDefaultFieldValue(), scopeId);
    };
    const setData = (data: any, scopeId?: string) => {
      const result = setDataForFieldType(data, scopeId);

      if (fieldType === 'value') {
        const value = fieldType === 'value' ? data : data.value;
        lastStoredDataState = value;
      } else {
        const dataToVisualize = getDataForFieldType(undefined, scopeId);
        lastStoredDataState = dataToVisualize;
      }

      visualizeData(lastStoredDataState);

      if (!canvasAppInstance?.isContextOnly) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (result) {
          (
            componentWrapper?.domElement as unknown as HTMLElement
          )?.classList?.add('border-white');
        } else {
          (
            componentWrapper?.domElement as unknown as HTMLElement
          )?.classList?.add(borderErrorColor);
        }
        (
          componentWrapper?.domElement as unknown as HTMLElement
        )?.classList?.remove('border-transparent');

        timeout = setTimeout(() => {
          (
            componentWrapper?.domElement as unknown as HTMLElement
          )?.classList?.remove('border-white');

          (
            componentWrapper?.domElement as unknown as HTMLElement
          )?.classList?.remove(borderErrorColor);

          (
            componentWrapper?.domElement as unknown as HTMLElement
          )?.classList?.add('border-transparent');
        }, 250);
      }

      return result;
    };

    const visualizeData = (lastStoredDataState: any) => {
      if (canvasAppInstance?.isContextOnly) {
        return;
      }
      if (htmlNode) {
        if (fieldType === 'value') {
          if (htmlNode?.domElement) {
            (htmlNode?.domElement as unknown as HTMLElement).innerHTML =
              getLabelAsHtml(
                getFormattedVariableValue(lastStoredDataState, 2, '')
              );
          }
          if (rect && rect.resize) {
            rect.resize(120);
          }
        } else {
          const dataToVisualize = lastStoredDataState;
          if (fieldType === 'dictionary') {
            if (dataToVisualize) {
              showDictionaryData(dataToVisualize || {}, htmlNode, isGlobal);
              if (rect && rect.resize) {
                rect.resize(240);
              }
            }
          } else if (fieldType === 'array') {
            if (Array.isArray(dataToVisualize ?? [])) {
              showArrayData(dataToVisualize || [], htmlNode, isGlobal);
              if (rect && rect.resize) {
                rect.resize(240);
              }
            }
          } else if (fieldType === 'grid') {
            if (
              dataToVisualize &&
              Array.isArray(dataToVisualize.data) &&
              dataToVisualize.data.length > 0
            ) {
              showGridData(
                dataToVisualize.data,
                {
                  rowCount: dataToVisualize.data.length,
                  columnCount: dataToVisualize.data[0].length,
                },
                htmlNode,
                isGlobal
              );
              if (rect && rect.resize) {
                rect.resize(dataToVisualize.data[0].length * 32);
              }
            } else {
              if (htmlNode?.domElement) {
                (htmlNode.domElement as unknown as HTMLElement).textContent =
                  'empty grid';
              }
              if (rect && rect.resize) {
                rect.resize(120);
              }
            }
          }
        }
      }
    };

    const getNodeStatedHandler = () => {
      return {
        data: structuredClone(lastStoredDataState),
        id: node.id,
      };
    };

    const setNodeStatedHandler = (_id: string, data: any) => {
      visualizeData(data);
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
            if (canvasAppInstance?.isContextOnly) {
              return;
            }
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
                if (rect && rect.resize) {
                  rect.resize(grid.data[0].length * 32);
                }
              } else {
                if (htmlNode?.domElement) {
                  (htmlNode?.domElement as unknown as HTMLElement).textContent =
                    'empty grid';
                }
                if (rect && rect.resize) {
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
      category: 'variables',
      nodeCannotBeReplaced: true,
      createVisualNode: (
        canvasApp: IFlowCanvasBase<NodeInfo>,
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
            resetVariable,
          });
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
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
                resetVariable,
              });
              if (id) {
                canvasApp.unRegisteGetNodeStateHandler(id);
                canvasApp.unRegisteSetNodeStateHandler(id);
                canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
                canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
              }

              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'initialValue',
            label: 'Initial value',
            conditions: {
              visibility: (values: any) => {
                return values?.fieldType !== 'enum';
              },
            },
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
            fieldName: 'initialEnumValue',
            label: 'Initial value',
            conditions: {
              visibility: (values: any) => {
                return values?.fieldType === 'enum';
              },
            },
            getOptions: (_values: any) => {
              const liveValues = node.nodeInfo?.formValues['enumValues'] ?? [];
              return (
                liveValues?.map((item: any) => {
                  return {
                    value: item.value,
                    label: item.label,
                  };
                }) ?? []
              );
            },
            value: initalValues?.['initialEnumValue'] ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                initialEnumValue: value,
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
                value: 'value' as FieldTypes,
                label: 'Value',
              },
              {
                value: 'dictionary' as FieldTypes,
                label: 'Dictionary',
              },
              {
                value: 'array' as FieldTypes,
                label: 'Array',
              },
              {
                value: 'grid' as FieldTypes,
                label: 'Grid/Matrix',
              },

              {
                value: 'enum' as FieldTypes,
                label: 'Enum',
              },
              // {
              //   value: 'dataTable',
              //   label: 'DataTable',
              // },
            ],
            onChange: (value: FieldTypes) => {
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
              {
                value: 'object',
                label: 'Object',
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
            conditions: {
              visibility: (values: any) => {
                return values?.fieldType !== 'enum';
              },
            },
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
          {
            fieldType: FormFieldType.Array,
            fieldName: 'enumValues',
            value: initalValues?.['enumValues'] ?? [],
            formElements: [
              {
                fieldType: FormFieldType.Text,
                fieldName: 'label',
                value: '',
              },
              {
                fieldType: FormFieldType.Text,
                fieldName: 'value',
                value: '',
              },
            ],
            onChange: (value: FieldTypes) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                enumValues: value ?? [],
              };
              initializeCompute();
              if (updated) {
                updated();
              }
            },
            conditions: {
              visibility: (values: any) => {
                return values?.fieldType === 'enum';
              },
            },
          },
        ];

        htmlNode = createElement(
          'div',
          {
            class: 'flex flex-col',
          },
          undefined,
          '-'
        ) as unknown as INodeComponent<NodeInfo>;

        componentWrapper = createNodeElement(
          'div',
          {
            class: `border-[2px] border-solid transition duration-500 ease-in-out inner-node bg-blue-600 text-white p-4 rounded text-center`,
          },
          undefined,
          htmlNode?.domElement as unknown as HTMLElement
        ) as unknown as IRectNodeComponent<NodeInfo>;

        rect = canvasApp.createRect(
          x,
          y,
          150,
          200,
          undefined,
          [],
          componentWrapper,
          {
            classNames: `p-4 rounded`,
            autoSizeToContentIfNodeHasNoThumbs: true,
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
              enumValues: initalValues?.['enumValues'] ?? [],
              initialEnumValue: initalValues?.['initialEnumValue'] ?? '',
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
              'absolute flex flex-row gap-2 items-center top-0 left-0 bg-slate-700 text-white px-1 rounded -translate-y-2/4 translate-x-1 whitespace-nowrap',
          },
          rect.nodeComponent?.domElement as unknown as HTMLElement,
          variableName
        ) as unknown as INodeComponent<NodeInfo>;

        createElement(
          'div',
          {
            class: 'block order-first text-white icon icon-all_inbox',
          },
          tagNode?.domElement as unknown as HTMLElement,
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        node = rect.nodeComponent;

        if (node.nodeInfo) {
          node.nodeInfo.formElements = formElements;
          node.nodeInfo.isVariable = true;
          node.nodeInfo.compute = compute;
          node.nodeInfo.getData = getData;
          node.nodeInfo.initializeCompute = initializeCompute;
          node.nodeInfo.delete = () => {
            canvasApp.unregisterVariable(variableName, node.id ?? '');
            if (node.id) {
              canvasApp.unRegisteGetNodeStateHandler(node.id);
              canvasApp.unRegisteSetNodeStateHandler(node.id);
            }

            (
              componentWrapper?.domElement as unknown as HTMLElement
            )?.classList?.remove('border-white');
            (
              componentWrapper?.domElement as unknown as HTMLElement
            )?.classList?.remove(borderErrorColor);
            (
              componentWrapper?.domElement as unknown as HTMLElement
            )?.classList?.add('border-transparent');

            if (timeout) {
              clearTimeout(timeout);
              timeout = undefined;
            }
          };
          node.nodeInfo.nodeCannotBeReplaced = true;
        }
        return node;
      },
    };
  };
