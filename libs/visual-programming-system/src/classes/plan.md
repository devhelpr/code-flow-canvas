# Technical generic Structure of the Visual Programming System

- BaseNode<T>
  - RectNode
  - ConnectionNode
    - BeziercubicConnectionNode
  - ThumbNode
    - InputThumbNode
    - OutputThumbNode
    - ControllerThumbNode

The above is the generic structure of the visual programming system. It can be implemented in various environments like web and native mobile.

## BaseNode<T>
- id
- domElement
- elements
- nodeInfo : T
- parent? : BaseNode<T>
- canvas : BaseNode<T>
  
- update()
    - reposition and setup visual properties depending on node class type and properties
    - called within interaction, either directly or by other nodes
      - when a rectnode is moved: the connections are updated
- updateEnd() 
    - is called after the node finished updating (an interaction ended)
  
- delete()
- setVisibility()


## RectNode
- x , y
- connections[]
- thumbs[]
- width , height

- onCanReceiveDroppedComponent()
- onReceiveDroppedComponent()
- onClick()

RectNodes can contain:
	- string markup
	- raw dom element with children
	- a canvas with nodes

## ConnectionNode
- xStart, yStart
- xEnd, yEnd
- pathName
- startNode
- endNode
- startNodeThumb
  	- to what thumb of the startNode is connected 
- endNodeThumb
- private vars for created dom elements
  - main domElement contains the line holder
  - domElements for svg element, svg group , path etc..

- calculateControlPoints()


## InputThumbNode / OutputThumbNode
- x , y
- rectNode
- type
- name
- index
- constraint
- label

- private vars for created dom elements
  - main domElement contains the thumb container
  - domElements for circle and inner circle


## Implementation plan
- comment out all code in App but keep old implementations in vps library
- start with implementing the RectNode
- ConnectionNode
- ThumbNodes
- storage
- animation
- running flow

## Interaction

- RectNodes and Connections can be put on stage/canvas by:
  - randomly (mvp)
  - dragging from a toolbar
  - by clicking a context menu
  - by setting the app in "add node to canvas"-mode and clicking on the canvas
  
- Connections can be added to the stage by:
  - dragging from a thumb of a RectNode to a thumb of another RectNode or to the canvas
  
- RectNodes and Connections are selected by clicking on them

- When a connection is selected, and the start or end node is dragged when connected to a RectNode, that connection is dragged by the respective thumb.. you can either disconnect it or drag it to a different thumb on a RectNode

- RectNodes can be moved by dragging them
  - When a RectNode is moved, the connections are updated

- Connections can be moved by dragging the start or end thumb
- Connections can be moved by dragging the line itself, and when the start and/or end thumb are connected to a RectNode: the rectnode's are also moved

- When a RectNode is selected, it can also be moved by the keyboard cursor keys

- When a RectNode is selected, special drag handlers are shown which can be used to drag the downstream and upstream connections and nodes.


## Hit testing

- Spatial partitioning is used to determine which nodes are hit by a mouse click or drag
- Spatial partitioning is also used to determine which nodes are hit by a dragged connection thumb
- Spatial partitioning is also used to determine the closest node so align a new node to one of its sides
- Mouse/touch/pointer hover events are not used for hit testing


## Storage

- The visual programming system is stored in a json format in indexeddb

