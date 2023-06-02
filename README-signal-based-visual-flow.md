# signal based visual flow

// SHOULD control-flow be handled by signals !???

## simple model

- every node has zero or one input
- every node has zero or more outputs
- input and outputs are single values
- there are two types of nodes: expressions and if-conditions

- every connection is a signal
- triggering a signal is done by assigning a value to the signal
- when a signal is triggered , the path is animated.. after the animation is finished, the connected nodes are executed

### expression node
- an expression supports one variable : input
- the output of the expression is assigned to the output of the node

### if-condition node
- an if-condition node has one input and two outputs ("then" and "else")
- if the expression is true, then output of the "then" output is triggered and "else" the "else" output is triggered
- this expression supports one variable as well: input
- to both outputs the input value is passed through
  


## extended model

- output and input port have types (primitives, objects, arrays and generics)
- the type of the output and input ports must match


