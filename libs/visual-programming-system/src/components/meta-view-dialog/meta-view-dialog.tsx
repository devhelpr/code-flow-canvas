import { IRectNodeComponent } from '../../interfaces';
import {
  BaseNodeInfo,
  IAnyMetaField,
  IArrayMetaField,
  IJSonMetaField,
  IMatrixMetaField,
  IMetaField,
  IOtherMetaField,
  IStringMetaField,
} from '../../types/base-node-info';
import { renderElement, createJSXElement } from '../../utils';

export const isInfoMetaField = (
  metaField: IMetaField
): metaField is IOtherMetaField => {
  return (metaField as unknown as IOtherMetaField).type === 'info';
};

export const isMatrixMetaField = (
  metaField: IMetaField
): metaField is IMatrixMetaField => {
  return (metaField as unknown as IMatrixMetaField).type === 'matrix';
};

export const isArrayMetaField = (
  metaField: IMetaField
): metaField is IArrayMetaField => {
  return (metaField as unknown as IArrayMetaField).type === 'array';
};

export const isJsonMetaField = (
  metaField: IMetaField
): metaField is IJSonMetaField => {
  return (metaField as unknown as IJSonMetaField).type === 'json';
};

export const isStringMetaField = (
  metaField: IMetaField
): metaField is IStringMetaField => {
  return (metaField as unknown as IStringMetaField).type === 'string';
};

export const isAnyMetaField = (
  metaField: IMetaField
): metaField is IAnyMetaField => {
  return (metaField as unknown as IAnyMetaField).type === 'any';
};

export const showMetaViewDialog = (
  nodeComponent: IRectNodeComponent<BaseNodeInfo>
) => {
  let dialogElement: any = undefined;
  let divElement: any = undefined;
  renderElement(
    <dialog
      class={'max-h-[100vh] overflow-auto p-4'}
      getElement={(element: HTMLDialogElement) =>
        (dialogElement = element as HTMLDialogElement)
      }
    >
      <div
        class="overflow-visible whitespace-pre-wrap flex flex-col gap-4"
        getElement={(element: HTMLDivElement) =>
          (divElement = element as HTMLDivElement)
        }
      ></div>
    </dialog>,
    document.body
  );
  if (
    dialogElement &&
    dialogElement instanceof HTMLDialogElement &&
    divElement &&
    divElement instanceof HTMLDivElement
  ) {
    dialogElement.addEventListener('click', function (event) {
      const rect = dialogElement.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        dialogElement.close();
      }
    });

    nodeComponent.nodeInfo?.meta?.forEach((meta) => {
      if (meta.getVisibility && !meta.getVisibility()) {
        return;
      }
      if (isInfoMetaField(meta)) {
        const description = meta.getDescription
          ? meta.getDescription()
          : meta.description;
        renderElement(<p>{description}</p>, divElement);
      } else if (isMatrixMetaField(meta) && meta.propertyName) {
        renderElement(<h1>{meta.displayName}</h1>, divElement);
        const matrix = meta.getData
          ? meta.getData()
          : nodeComponent.nodeInfo?.formValues?.[meta.propertyName];
        if (matrix) {
          const rowCount = meta.getRowCount ? meta.getRowCount() : 0;
          const columnCount = meta.getColumnCount ? meta.getColumnCount() : 0;

          let headerRowElement: any = undefined;
          let tableBodyElement: any = undefined;
          renderElement(
            <table class="font-mono">
              <thead>
                <tr
                  getElement={(element: HTMLTableRowElement) =>
                    (headerRowElement = element as HTMLTableRowElement)
                  }
                ></tr>
              </thead>
              <tbody
                getElement={(element: HTMLElement) =>
                  (tableBodyElement = element as HTMLElement)
                }
              ></tbody>
            </table>,
            divElement
          );

          renderElement(<td class="text-right px-2"></td>, headerRowElement);
          for (let j = 0; j < columnCount; j++) {
            renderElement(
              <td class="text-right px-2">{j + 1}</td>,
              headerRowElement
            );
          }
          for (let i = 0; i < rowCount; i++) {
            let rowElement: any = undefined;
            renderElement(
              <tr
                getElement={(element: HTMLTableRowElement) =>
                  (rowElement = element as HTMLTableRowElement)
                }
              ></tr>,
              tableBodyElement
            );

            renderElement(<td class="text-right px-2">{i + 1}</td>, rowElement);
            for (let j = 0; j < columnCount; j++) {
              let columnElement: any = undefined;
              renderElement(
                <td
                  class="text-right px-2"
                  getElement={(element: HTMLDivElement) =>
                    (columnElement = element as HTMLDivElement)
                  }
                ></td>,
                rowElement
              );
              let value = matrix[i]?.[j];
              if (typeof value === 'number') {
                value = `${value.toFixed(2)}`;
              } else {
                value = `${value}`;
              }
              columnElement.innerHTML = value;
            }
          }
        }
      } else if (isStringMetaField(meta) && meta.propertyName) {
        renderElement(<h1>{meta.displayName}</h1>, divElement);
        const value = meta.getText
          ? meta.getText()
          : nodeComponent.nodeInfo?.formValues?.[meta.propertyName];
        if (value) {
          renderElement(<p>{value}</p>, divElement);
        }
      } else if (isJsonMetaField(meta) && meta.propertyName) {
        renderElement(<h1>{meta.displayName}</h1>, divElement);
        const json =
          meta.getData?.() ??
          nodeComponent.nodeInfo?.formValues?.[meta.propertyName] ??
          {};
        if (json) {
          renderElement(
            <pre class="whitespace-pre-wrap">
              {JSON.stringify(json, null, 2)}
            </pre>,
            divElement
          );
        }
      } else if (isAnyMetaField(meta) && meta.propertyName) {
        renderElement(<h1>{meta.displayName}</h1>, divElement);
        const data =
          meta.getData?.() ??
          nodeComponent.nodeInfo?.formValues?.[meta.propertyName] ??
          {};
        if (data) {
          if (typeof data === 'object' || Array.isArray(data)) {
            renderElement(
              <pre class="whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>,
              divElement
            );
          } else {
            renderElement(<p>{data}</p>, divElement);
          }
        }
      } else if (isArrayMetaField(meta) && meta.propertyName) {
        renderElement(<h1>{meta.displayName}</h1>, divElement);
        const array = meta.getData
          ? meta.getData()
          : nodeComponent.nodeInfo?.formValues?.[meta.propertyName];
        if (array) {
          const columnCount = meta.getCount ? meta.getCount() : 0;

          let headerRowElement: any = undefined;
          let tableBodyElement: any = undefined;
          renderElement(
            <table class="font-mono">
              <thead>
                <tr
                  getElement={(element: HTMLTableRowElement) =>
                    (headerRowElement = element as HTMLTableRowElement)
                  }
                ></tr>
              </thead>
              <tbody
                getElement={(element: HTMLElement) =>
                  (tableBodyElement = element as HTMLElement)
                }
              ></tbody>
            </table>,
            divElement
          );

          for (let j = 0; j < columnCount; j++) {
            renderElement(
              <td class="text-right px-2">{j + 1}</td>,
              headerRowElement
            );
          }
          let rowElement: any = undefined;
          renderElement(
            <tr
              getElement={(element: HTMLTableRowElement) =>
                (rowElement = element as HTMLTableRowElement)
              }
            ></tr>,
            tableBodyElement
          );

          for (let j = 0; j < columnCount; j++) {
            let columnElement: any = undefined;
            renderElement(
              <td
                class="text-right px-2"
                getElement={(element: HTMLDivElement) =>
                  (columnElement = element as HTMLDivElement)
                }
              ></td>,
              rowElement
            );
            let value = array[j];
            if (typeof value === 'number') {
              value = `${value.toFixed(2)}`;
            } else {
              value = `${value}`;
            }
            columnElement.innerHTML = value;
          }
        }
      }
    });

    dialogElement.showModal();
  }
};
