import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';

/*
  @if:content: {
    ..
  }
  @if:toolcall: {
    ..
  }
*/

const isArrayOrObject = (json: any) => {
  return Array.isArray(json) || typeof json === 'object';
};

const evaluateAtProperty = (
  newJson: any,
  key: string,
  value: any,
  payload: any,
  initialPayload?: any
) => {
  if (key.startsWith('@serialize')) {
    const setProperty = key.replace('@serialize:', '');

    const toSerialize: Record<string, any> = {};
    Object.keys(value).forEach((mapKey) => {
      const mapValue = value[mapKey];
      if (mapKey.startsWith('@') && !mapKey.startsWith('@@')) {
        //console.log('mapKey', mapKey, mapValue, payload, initialPayload);
        const newValue: Record<string, any> = {};
        evaluateAtProperty(newValue, mapKey, mapValue, payload, initialPayload);

        const setProperty = mapKey.split(':')[1];
        const propertyValue = newValue[setProperty];
        if (typeof propertyValue === 'string') {
          toSerialize[setProperty] = propertyValue;
        } else if (isArrayOrObject(propertyValue)) {
          toSerialize[setProperty] = JSON.stringify(
            transformJSON(propertyValue, setProperty, '', initialPayload)
          );
        } else {
          toSerialize[setProperty] = propertyValue;
        }
        // console.log('result', newValue, JSON.stringify(newValue[setProperty]));
        // toSerialize[setProperty] = JSON.stringify(newValue[setProperty]);
      } else {
        if (isArrayOrObject(mapValue)) {
          toSerialize[mapKey] = JSON.stringify(
            transformJSON(mapValue, mapKey, '', initialPayload)
          );
        } else {
          toSerialize[mapKey] = mapValue;
        }
      }
    });

    const serializedValue = JSON.stringify(toSerialize);
    newJson[setProperty] = serializedValue;
  } else if (key.startsWith('@if:')) {
    const ifProperty = key.replace('@if:', '').split(':')[0];
    //console.log('ifProperty', ifProperty, value);
    if (payload[ifProperty]) {
      Object.keys(value).forEach((mapKey) => {
        const mapValue = value[mapKey];
        if (mapKey.startsWith('@') && !mapKey.startsWith('@@')) {
          evaluateAtProperty(
            newJson,
            mapKey,
            mapValue,
            payload,
            initialPayload
          );
        } else {
          if (isArrayOrObject(mapValue)) {
            transformJSON(mapValue, mapKey, '', initialPayload);
          } else {
            newJson[mapKey] = mapValue;
          }
        }
      });
    }
  } else if (key.startsWith('@pushTo:')) {
    const setProperty = key.replace('@pushTo:', '').split(':')[0];
    if (!newJson[setProperty]) {
      newJson[setProperty] = [];
    }
    const newItem: any = {};
    Object.keys(value).forEach((mapKey) => {
      if (mapKey.startsWith('@') && !mapKey.startsWith('@@')) {
        const mapValue = value[mapKey];
        evaluateAtProperty(
          newItem,
          mapKey,
          mapValue,
          initialPayload,
          initialPayload
        );
      } else {
        const mapValue = value[mapKey];
        if (isArrayOrObject(mapValue)) {
          transformJSON(mapValue, mapKey, '', initialPayload);
        } else {
          newItem[mapKey] = mapValue;
        }
      }
    });

    newJson[setProperty].push(newItem);
  } else if (key.startsWith('@expression:')) {
    const setProperty = key.replace('@expression:', '');
    const compiledExpression = compileExpressionAsInfo(value);
    const expressionFunction = (
      new Function('payload', `${compiledExpression.script}`) as unknown as (
        payload?: any
      ) => any
    ).bind(compiledExpression.bindings);

    const result = runExpression(
      expressionFunction,
      payload,
      false, // when True ... this fails when expression contains array indexes...
      compiledExpression.payloadProperties
    );
    newJson[setProperty] = result;
  } else if (key.startsWith('@set:')) {
    const newKey = key.replace('@set:', '');
    console.log('set', newKey, value, payload);
    newJson[newKey] = payload?.[value] ?? '';
  } else if (key === '@map') {
    /*
		  "@map": {
			  "@comment": "this maps payload["payload-messages"] to messages",
			  "input": "payload-messages",
			  "property": "messages",
			  "map": {
				  "type": "object",
				  "properties": {
					  "@set:role": "role",
					  "@set:content": "message"
				  }
			  }
		  },
		*/
    if (value.input && value.property && value.map) {
      const toMapValue = payload?.[value.input];
      if (toMapValue && Array.isArray(toMapValue)) {
        const mappedValue = toMapValue.map((item: any) => {
          const newItem: any = {};
          Object.keys(value.map.properties).forEach((mapKey) => {
            const mapValue = value.map.properties[mapKey];
            evaluateAtProperty(newItem, mapKey, mapValue, item, initialPayload);
          });
          return newItem;
        });
        //console.log('map', toMapValue);
        if (newJson[value.property]) {
          newJson[value.property].push(...mappedValue);
        } else {
          newJson[value.property] = mappedValue;
        }
      }
    }
  }
};

export const transformJSON = (
  json: any,
  _key: string | undefined,
  path: string,
  payload?: any
) => {
  if (Array.isArray(json)) {
    const newJson: any[] = [];
    json.forEach((value, index) => {
      //console.log(path + '[' + index + ']');
      if (isArrayOrObject(value)) {
        const result = transformJSON(
          value,
          undefined,
          path + '[' + index + ']',
          payload
        );
        if (result) {
          newJson.push(result);
        }
      } else {
        newJson.push(value);
      }
    });
    return newJson;
  } else if (typeof json === 'object') {
    const newJson: Record<string, any> = {};
    Object.keys(json).forEach((key) => {
      const value = json[key];
      //console.log(`${path ? path + '.' : ''}${key}`);

      if (key.startsWith('@') && !key.startsWith('@@')) {
        evaluateAtProperty(newJson, key, value, payload, payload);
      } else if (isArrayOrObject(value)) {
        const result = transformJSON(
          value,
          key,
          `${path ? path + '.' : ''}${key}`,
          payload
        );
        if (result) {
          newJson[key] = result;
        }
      } else {
        newJson[key] = value;
      }
    });
    return newJson;
  } else {
    console.error(path, json);
    throw new Error('Unexpected JSON');
  }
};
