# "combined components"

(other terms : "composite components", "container components", "compound components" , "composable components")

for example a connection-node with multiple control-points
the control-points are components as well
when the position of a control-point changes, the connection-node should be updated

however... when the connection-node is moved .. the control-points should be moved as well

how to link these?

a node has a position and a list of elements
should it have a separate list of components?
difference between elements and components :
    - element are part of the rendering tree of a node
    - components have their own rendering tree

    - in a DOM context, elements are DOM-elements like a div, a span, a svg, a canvas, a text node etc...


in the case of "control-points" ... the components should be moveable.. but this is not always required
.. in the case of input-output points .. the components should not be moveable but have different properties
    .. they can have constraints depending on the parent node-task-type in a vps environment

.. sometimes the sub-components should be moveable but only within the constraints of the parent

the parent components can have connections with other components without them being child/sub components 
    ... if you move a parent component, the connections should be updated
    ... using "downstream or upstream"-dragging.. whole sets of components can be moved

## implementation

should IElementNode have a list of component-id's or references?
should IElementNode have an x , y and z position? or even a timestamp?

... an IElemntNode is not always placed on a canvas but can be used differently as well.

... implementations can differ depending on whether it is used in a 2d or 3d context...
