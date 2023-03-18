# TODO's

- rename "connection" to "path" where applicable (nodeType should be path instead of connection)

- implement strategy pattern for connection update
    - implement strategies for:
        - moving path/connection
        - updating curve start/end/controller point
        - updating connection start/end point and applicable controller point for 
            nodes which are the start or end for a connection

    - before/after update strategies
    - reading width/height from actionComponent should be made possible

    - more complex svg for rect (title text/subtitle text)