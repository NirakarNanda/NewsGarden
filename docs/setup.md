# Setup

## Requirements

- Node.js LTS
- npm
- MongoDB

## Development order

1. Start MongoDB.
2. Configure backend/.env.
3. Start backend.
4. Configure frontend/.env.local.
5. Start frontend.

The first implementation milestone is:

Brain creates a task → TechNewsAgent executes → event emitted → backend stores state → frontend displays the agent as working.
