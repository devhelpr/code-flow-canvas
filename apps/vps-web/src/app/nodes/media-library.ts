import {
  CanvasAppInstance,
  IRectNodeComponent,
  IThumb,
  Rect,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { NodeInfo } from '../types/node-info';
import { FormField, FormFieldType } from '../components/FormField';

const fieldName = 'media-library-input';
const labelName = 'Media library';
const nodeName = 'media-library-node';
const familyName = 'flow-canvas';
const thumbs: IThumb[] = [];

export const getMediaLibraryNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let rect: Rect<NodeInfo> | undefined;
  let mediaFiles: any[] = [];

  const initializeCompute = () => {
    if (mediaFiles && contextInstance) {
      const mediaLibrary = contextInstance.getMediaLibrary();
      if (mediaLibrary) {
        mediaFiles.forEach((value: any) => {
          console.log('store media', value);
          mediaLibrary.storeFile(value.mediaCodeName, value.mediaFile);
        });
      }
    }
    return;
  };
  const compute = (_input: string, _loopIndex?: number, _payload?: any) => {
    const result = node.nodeInfo?.formValues?.['array'] ?? [];
    return {
      result: result,
      output: result,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    200,
    100,
    thumbs,
    (values?: InitialValues): FormField[] => {
      const initialInputType = values?.['files'] ?? [];
      mediaFiles = initialInputType;
      return [
        {
          fieldType: FormFieldType.Array,
          fieldName: 'files',
          label: 'Media files',
          value: initialInputType,
          values: initialInputType,
          formElements: [
            {
              fieldName: 'mediaFile',
              fieldType: FormFieldType.File,
              value: '',
            },
            {
              fieldName: 'mediaCodeName',
              fieldType: FormFieldType.Text,
              value: '',
            },
          ],
          onChange: (values: unknown[]) => {
            if (!node.nodeInfo) {
              return;
            }

            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              ['files']: [...values],
            };
            if (mediaFiles && contextInstance) {
              const mediaLibrary = contextInstance.getMediaLibrary();
              if (mediaLibrary) {
                mediaFiles.forEach((mediaFile) => {
                  console.log('delete media', mediaFile);
                  mediaLibrary.deleteFile(mediaFile.codeFileName);
                });

                values.forEach((value: any) => {
                  console.log('store media', value);
                  mediaLibrary.storeFile(value.mediaCodeName, value.mediaFile);
                });
              }
            }
            if (updated) {
              updated();
            }
            if (rect) {
              rect.resize();
            }

            mediaFiles = values;
          },
        },
      ];
    },
    (nodeInstance) => {
      rect = nodeInstance.rect;
      node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
      if (node.nodeInfo) {
        node.nodeInfo.initializeOnStartFlow = true;
      }
      contextInstance = nodeInstance.contextInstance;
      rect?.resize();
    },
    {
      category: 'Media',
      adjustToFormContent: true,
    }
  );
};
