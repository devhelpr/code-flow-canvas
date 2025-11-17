# Backpropagation Flow Diagram

This diagram illustrates how backpropagation works in the flow execution system, showing both forward execution and backward propagation of data.

## Flow Execution with Backpropagation

```mermaid
graph LR
    subgraph "Forward Execution (White Program Counter)"
        direction LR
        A[Start Node<br/>Output: data] -->|Forward<br/>White| B[Processing Node<br/>Compute: process]
        B -->|Forward<br/>White| C[End Node<br/>Compute: result]
    end
    
    subgraph "Backpropagation (Orange Program Counter)"
        direction RL
        C -.->|Backpropagate<br/>Orange| B
        B -.->|Backpropagate<br/>Orange| A
    end
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1f5
    style A stroke:#0066cc,stroke-width:2px
    style B stroke:#cc6600,stroke-width:2px
    style C stroke:#cc0066,stroke-width:2px
```

## Detailed Backpropagation Flow

```mermaid
sequenceDiagram
    participant Start as Start Node
    participant Process as Processing Node
    participant End as End Node
    
    Note over Start,End: Forward Execution (White Program Counter)
    Start->>Process: Execute compute()<br/>Output: data
    Process->>End: Execute compute()<br/>Output: result
    
    Note over End,Start: Backpropagation (Orange Program Counter)
    End->>End: Return {<br/>  result: value,<br/>  backpropagate: feedbackData<br/>}
    End->>Process: backpropagate(feedbackData)
    Process->>Process: Update internal state<br/>with feedbackData
    Process->>Start: backpropagate(processedFeedback)
    Start->>Start: Update internal state<br/>with processedFeedback
```

## Node Connection Visualization

```mermaid
graph TB
    subgraph "Visual Representation"
        direction LR
        SN[Start Node<br/>🟦] -->|"→ Forward (White)"| PN[Processing Node<br/>🟨]
        PN -->|"→ Forward (White)"| EN[End Node<br/>🟪]
        
        EN -.->|"← Backpropagate (Orange)"| PN
        PN -.->|"← Backpropagate (Orange)"| SN
    end
    
    style SN fill:#e1f5ff,stroke:#0066cc,stroke-width:3px
    style PN fill:#fff4e1,stroke:#cc6600,stroke-width:3px
    style EN fill:#ffe1f5,stroke:#cc0066,stroke-width:3px
```

## Complete Execution Cycle

```mermaid
stateDiagram-v2
    [*] --> ForwardExecution
    
    state ForwardExecution {
        [*] --> StartNode
        StartNode --> ProcessingNode: Forward (White)
        ProcessingNode --> EndNode: Forward (White)
        EndNode --> CheckBackpropagation
    }
    
    state CheckBackpropagation {
        [*] --> HasBackpropagation
        HasBackpropagation --> BackwardExecution: Yes
        HasBackpropagation --> [*]: No
    }
    
    state BackwardExecution {
        [*] --> EndToProcess: Backpropagate (Orange)
        EndToProcess --> ProcessToStart: Backpropagate (Orange)
        ProcessToStart --> [*]
    }
    
    ForwardExecution --> CheckBackpropagation
    BackwardExecution --> [*]
```

## Example: Neural Network Layer

```mermaid
graph LR
    subgraph "Input Layer"
        I1[Input Node 1<br/>Weights: w1, w2]
        I2[Input Node 2<br/>Weights: w3, w4]
    end
    
    subgraph "Hidden Layer"
        H[Hidden Node<br/>Activation: tanh]
    end
    
    subgraph "Output Layer"
        O[Output Node<br/>Loss Calculation]
    end
    
    I1 -->|Forward| H
    I2 -->|Forward| H
    H -->|Forward| O
    
    O -.->|Backpropagate<br/>Gradient: 0.15| H
    H -.->|Backpropagate<br/>Gradient: 0.08| I1
    H -.->|Backpropagate<br/>Gradient: 0.07| I2
    
    style I1 fill:#e1f5ff
    style I2 fill:#e1f5ff
    style H fill:#fff4e1
    style O fill:#ffe1f5
```

## Key Concepts

1. **Forward Execution**: Normal flow execution with white program counter moving from start to end nodes
2. **Backpropagation**: Reverse flow with orange program counter moving from end to start nodes
3. **Data Flow**: 
   - Forward: Output data flows from source to destination
   - Backward: Feedback/gradient data flows from destination to source
4. **Visual Indicators**:
   - White cursor = Forward execution
   - Orange cursor = Backpropagation
   - No message bubble for backpropagation (only program counter)

