# VpsWeb

Visual programming system build with web components using DOM as a canvas mixing svg and html using RAW DOM API.

## TODO's

- use custom properties from within components
    - like : x, y, width, height, id, taskType , shapeType

- basic interaction state machine
    - moving nodes
    - call node-events when canvas events are triggered... do this from where? state-machine or canvas-component?
        - register the events within the state-machine?
    - update x and y custom properties of the node-component ..  not just only on the dom element

- add svg test component
- connect two nodes with a line

- update parts of a markup-node-component

- "signals"
- update state of components with children

- how can this be made declarative using the layout-compiler and expression-compiler?

- can this be transformed to a native app?

- run the compilation/build steps separately from the dev-server within the app build process...

## How to run


## How to build


## How to test


## Solutions for problems

- after installing a new dependency and the typescript definitions are not found, run the following command in vs.code:
    >TypeScript: Restart TS Server
