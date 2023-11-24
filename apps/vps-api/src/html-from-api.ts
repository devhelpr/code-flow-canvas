const systemPrompt = `You are an expert web developer who specializes in tailwind css.
A user will provide you with a low-fidelity wireframe of an application.
You will return a single html file that uses HTML, tailwind css, and JavaScript to create a high fidelity website.
Include any extra CSS and JavaScript in the html file.
If you have any images, load them from Unsplash or use solid colored retangles.
The user will provide you with notes in text and description how input should be treat.
Use the users description to come up with a design for the application.
Make the application responsive, it should look good on mobile and desktop.
Add visualitions where applicable e.g a graph or chart.
Dont add any comments in the html file or after the html file.
Use creative license to make the application more fleshed out.
Use JavaScript modules and unkpkg to import any necessary dependencies.

Respond ONLY with the contents of the html file.`;

/*
	input prompt:


	create a UI that shows an array (as cells next to each it other, wrap the row if needed) 
	based on the existing global variable "input", this variable is already defined by the system (don't add it yourself!). Rerender the UI when an existing global method onExecute is called.
Show a bar-chart visualisation of the array.
Initialize the global variable "input" after loading the page with an empty array.



Based on the existing global variable "input", this variable is already defined by the system (don't add it yourself!):
Create a UI that shows an array (as cells next to each it other, wrap the row if needed). 
Show a bar-chart visualisation of the array.

Initialize the global variable "input" after loading the page with an empty array.
Rerender the UI when an existing global method onExecute is called.

*/

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
const tailwindText = 'Turn this into a single html file using tailwind.';
export async function getHtmlFromOpenAI({
  message,
  apiKey,
}: {
  message: string;
  apiKey: string;
}) {
  console.log('getHtmlFromOpenAI', message);
  const body: GPT4VCompletionRequest = {
    //model: 'gpt-4-vision-preview',
    model: 'gpt-4-1106-preview',
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          //   {
          //     type: 'image_url',
          //     image_url: {
          //       url: image,
          //       detail: 'high',
          //     },
          //   },
          {
            type: 'text',
            text: tailwindText,
          },
          {
            type: 'text',
            text: message,
          },
        ],
      },
    ],
  };

  let json = null;
  if (!apiKey) {
    throw Error('You need to provide an API key (sorry)');
  }
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    console.log(resp);
    json = await resp.json();
  } catch (e) {
    console.log(e);
  }

  return json;
}

type MessageContent =
  | string
  | (
      | string
      | {
          type: 'image_url';
          image_url:
            | string
            | {
                url: string;
                detail: 'low' | 'high' | 'auto';
              };
        }
      | {
          type: 'text';
          text: string;
        }
    )[];

export type GPT4VCompletionRequest = {
  model: 'gpt-4-vision-preview' | 'gpt-4-1106-preview';
  messages: {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: MessageContent;
    name?: string | undefined;
  }[];
  functions?: any[] | undefined;
  function_call?: any | undefined;
  stream?: boolean | undefined;
  temperature?: number | undefined;
  top_p?: number | undefined;
  max_tokens?: number | undefined;
  n?: number | undefined;
  best_of?: number | undefined;
  frequency_penalty?: number | undefined;
  presence_penalty?: number | undefined;
  logit_bias?:
    | {
        [x: string]: number;
      }
    | undefined;
  stop?: (string[] | string) | undefined;
};
