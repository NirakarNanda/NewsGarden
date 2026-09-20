# NewsGarden V1 Architecture

## System

Browser / Frontend
    ↓
Backend API / realtime events
    ↓
Brain Agent + Workflow Engine
    ↓
Specialized Agents
    ↓
Tools (web, AI, images, notifications)
    ↓
MongoDB

## UI principle

The 2D campus is the visual experience. Real backend agent events drive character state and GSAP movement.

Example:

AGENT_STARTED
→ AgentMovementRequested
→ character walks to department
→ working animation

AGENT_TASK_COMPLETED
→ character leaves workstation
→ idle behavior: Cafe / Manga Library / Badminton Court

## Product rule

No chat interface in V1.
No automatic publication.
Human approval is required before an edition becomes published.
