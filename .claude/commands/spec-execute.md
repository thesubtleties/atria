# Spec Execute Command

Execute specific tasks from the approved task list.

## Usage
```
/spec-execute [task-id] [feature-name]
```

## Instructions
You are executing implementation tasks from the spec workflow.

1. **Prerequisites**
   - Ensure tasks.md exists and is approved
   - Load requirements.md, design.md, and tasks.md for context
   - Identify the specific task to execute

2. **Task Execution**
   - Focus on ONE task at a time
   - If task has sub-tasks, start with those
   - Follow the implementation details from design.md
   - Verify against requirements specified in the task

3. **Implementation Guidelines**
   - Write clean, maintainable code
   - Follow existing code patterns and conventions
   - Include appropriate error handling
   - Add unit tests where specified
   - Document complex logic

4. **Validation**
   - Verify implementation meets acceptance criteria
   - Run tests if they exist
   - Check for lint/type errors
   - Ensure integration with existing code

5. **Completion**
   - Mark task as complete in tasks.md
   - Update execution log
   - Stop and wait for user review
   - DO NOT automatically proceed to next task

## Task Selection
If no task-id specified:
- Look at tasks.md for the spec
- Recommend the next pending task
- Ask user to confirm before proceeding

## Examples
```
/spec-execute 1 user-authentication
/spec-execute 2.1 user-authentication
```

## Important Rules
- Only execute ONE task at a time
- Always stop after completing a task
- Wait for user approval before continuing
- Never skip tasks or jump ahead
