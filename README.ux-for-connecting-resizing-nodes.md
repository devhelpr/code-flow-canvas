# UX for resizing nodes

- resize handlers should be hidden
- when dragging a connection to a node, when near a node, show the node's resize handlers
- reszing should always be possible, resizes handlers should be invisible but a hint should
  be shown when hovering over the node with the mouse
  ... how to handle this on a touch device?

- a node can be a connector itself or can have visible input/ouput connectors
  - when a node itself is a connector.. the connect-point of a connection is the center of the node
  - input/output connectors should be visually different
  - nodes can have multiple input/output connectors if needed and depending of the flow-engine and the node's capabilities
  - connectors can have optional labels
  - connectors can have different placement on the node
    - vertically centered on the left/right side
    - aligned from the top
    - at the top and/or bottom of node and then horizontally centered (especially in combination with a diamond shape type for conditional nodes)

 - a connection can be made by dragging a connection start/end point to a connector
 - a connection can be made by dragging from an empty connector to a connector

- some things to take in consideration:

	- nodes can be resized in any direction
	- nodes can have different shapes.. but the resizing should be the same for all nodes
      using a rectangle as a base
	- nodes can have different connectors on different sides and locations
  
	- nodes can have combined svg and html tags


	- nodes and lines/connections can have programmable behavior
		depending on the attached "flow-engine"/strategy this behavior is executed


- flow-engine's:
  - flow-based-programming
  - port-based "react"-model
  - "cellular-automata" .. grid that is controlled by a visual algorithm




- setup for DOM-structure for nodes

	currently the connectors and resize handlers are added to the root elements map and are standalone nodes living on the DOM element which hold all the nodes.. although they are connected using the relations

	a better approach would be to have a node to be the parent DOM node for the connectors/resize handlers...
		- positioning might be easier (position is relative to the node)
		- z-indexing is relative and controllable by the node to make it easier to add html-content
			... when the node is moved up the render-tree of the main DOM element which holds all the nodes.. the connectors/resizers are moved with that automatically