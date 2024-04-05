# commands

## create new publishable typescript library

npx nx g @nrwl/js:lib [name] --publishable --importPath [npm package name]


npx nx g @nrwl/js:lib dom-components --publishable --importPath @devhelpr/dom-components
npx nx g @nrwl/js:lib media-library --publishable --importPath @devhelpr/media-library

## deno 

npx nx g @nx/deno:app vps-api --frontendProject vps-web


## Solutions for problems

- after installing a new dependency and the typescript definitions are not found, run the following command in vs.code:
    >TypeScript: Restart TS Server
