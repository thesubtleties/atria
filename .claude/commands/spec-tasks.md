# Spec Tasks Command

Generate implementation task list based on approved design.

## Usage
```
/spec-tasks [feature-name]
```

## Instructions
You are working on the tasks phase of the spec workflow.

1. **Prerequisites**
   - Ensure design.md exists and is approved
   - Load both requirements.md and design.md for context
   - Understand the complete feature scope

2. **Generate Task List**
   - Break design into atomic, executable coding tasks
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

3. **Task Guidelines**
   - Tasks should be concrete and actionable
   - Include specific file names and components
   - Build incrementally (each task builds on previous)
   - Reference requirements using _Requirements: X.Y_ format
   - Use test-driven development approach

4. **Task Format**
   ```markdown
   - [ ] 1. Task description
     - Sub-bullet with details
     - Specific files to create/modify
     - _Requirements: 1.1, 2.3_
   ```

5. **Excluded Tasks**
   - User acceptance testing
   - Deployment to production
   - Performance metrics gathering
   - User training or documentation
   - Business process changes

6. **Approval Process**
   - Present the complete task list
   - Ask: "Do the tasks look good?"
   - Make revisions based on feedback
   - Continue until explicit approval

## Task Structure
```markdown
# Implementation Plan

- [ ] 1. Setup project structure
  - Create directory structure
  - Define core interfaces
  - _Requirements: 1.1_

- [ ] 2. Implement data models
- [ ] 2.1 Create base model classes
  - Define validation methods
  - Write unit tests
  - _Requirements: 2.1, 2.2_
```

## Next Phase
After approval, use `/spec-execute` to implement tasks.
