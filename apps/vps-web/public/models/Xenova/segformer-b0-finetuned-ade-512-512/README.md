---
base_model: nvidia/segformer-b0-finetuned-ade-512-512
library_name: transformers.js
pipeline_tag: image-segmentation
---

https://huggingface.co/nvidia/segformer-b0-finetuned-ade-512-512 with ONNX weights to be compatible with Transformers.js.

## Usage (Transformers.js)

If you haven't already, you can install the [Transformers.js](https://huggingface.co/docs/transformers.js) JavaScript library from [NPM](https://www.npmjs.com/package/@xenova/transformers) using:
```bash
npm i @xenova/transformers
```

**Example:** Image segmentation with `Xenova/segformer-b0-finetuned-ade-512-512`.

```js
import { pipeline } from '@xenova/transformers';

// Create an image segmentation pipeline
const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512');

// Segment an image
const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/house.jpg';
const output = await segmenter(url);
console.log(output)
// [
//   {
//     score: null,
//     label: 'wall',
//     mask: RawImage { ... }
//   },
//   {
//     score: null,
//     label: 'building',
//     mask: RawImage { ... }
//   },
//   ...
// ]
```

You can visualize the outputs with:
```js
for (const l of output) {
  l.mask.save(`${l.label}.png`);
}
```

---

Note: Having a separate repo for ONNX weights is intended to be a temporary solution until WebML gains more traction. If you would like to make your models web-ready, we recommend converting to ONNX using [🤗 Optimum](https://huggingface.co/docs/optimum/index) and structuring your repo like this one (with ONNX weights located in a subfolder named `onnx`).