# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 3794c26c-37c0-4558-aba0-cb47cfedb9aa -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Step: Create package.json and install dependencies
<!-- chat-id: 9693681e-07b5-4e61-bd2e-711a4bb09bf4 -->

Create `package.json` with all required dependencies and npm scripts for running the demo.

---

### [ ] Step: Create frontend entry point files

Create the following files:
- `index.html` - HTML entry point
- `main/main.jsx` - React app bootstrapping
- `main/App.jsx` - Root component wrapping MeetingAssistant

---

### [ ] Step: Create Express backend server

Create `server.js` with Express to serve the `/api/agent` endpoint.

---

### [ ] Step: Configure Vite with API proxy

Create `vite.config.js` to proxy `/api` requests to the backend server.

---

### [ ] Step: Update .gitignore for Node.js

Add `node_modules/`, `dist/`, and other Node.js artifacts to `.gitignore`.

---

### [ ] Step: Test the demo

1. Run `npm install`
2. Run `npm run dev`
3. Open browser to verify the Meeting Assistant UI loads
4. Write completion report to `{@artifacts_path}/report.md`
