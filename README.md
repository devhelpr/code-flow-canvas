# VpsWeb

Visual programming system build with web components using DOM as a canvas mixing svg and html using RAW DOM API.

## TODO's

- PoC : render tree with conditions using signals deeper in the tree
- PoC : have classnames react to signals

- Markup-compiler : properties with expressions


- use custom properties from within components
    - like : x, y, width, height, id, taskType , shapeType

- basic interaction state machine
    - moving nodes
    - call node-events when canvas events are triggered... do this from where? state-machine or canvas-component?
        - register the events within the state-machine?
    - update x and y custom properties of the node-component ..  not just only on the dom element


- update parts of a markup-node-component

- "signals"
- update state of components with children

- (see poc below) how can this be made declarative using the layout-compiler and expression-compiler?

- can this be transformed to a native app?

- run the compilation/build steps separately from the dev-server within the app build process...

## How to run


## How to build


## How to test


## Solutions for problems

- after installing a new dependency and the typescript definitions are not found, run the following command in vs.code:
    >TypeScript: Restart TS Server

## poc's

- have a button "create node type" which :
    - opens a modal with a raw textarea editor and title input
    - you can input markup with expressions in it
    - after pressing "save" a button is added to the toolbar .. create [title]
    - when you click the button ... the node with that markup is created on the canvas with a random position
    - next: each variable that is called within an expression is added as a input connection to the node
       (in a first attempt these could be edited via a settings modal that you can open after selecting the node)
    - show the output of the expression in the node
    - next: control the output of node
    - next: define signals within expressions and output these from the node?

- "2d node and wire UI with gravity" .. instead of having a "top-down" view.. make a side-view with gravity 
    - nodes float in the air.. but it's output falls down to the next node