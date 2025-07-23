# Spec Design Command

Generate design document based on approved requirements.

## Usage
```
/spec-design [feature-name]
```

## Instructions
You are working on the design phase of the spec workflow.

1. **Prerequisites**
   - Ensure requirements.md exists and is approved
   - Load the requirements document for context
   - Research existing codebase patterns and architecture

2. **Generate Design Document**
   - Create comprehensive design following the template
   - Include all required sections:
     - Overview
     - Architecture
     - Components and Interfaces
     - Data Models
     - Error Handling
     - Testing Strategy

3. **Research Phase**
   - Analyze existing codebase for patterns
   - Identify integration points
   - Research technical dependencies
   - Consider scalability and maintainability

4. **Design Content**
   - Use Mermaid diagrams for visual representations
   - Define clear interfaces and contracts
   - Specify data models and validation rules
   - Plan error handling and edge cases
   - Outline testing approach

5. **Approval Process**
   - Present the complete design document
   - Ask: "Does the design look good? If so, we can move on to the implementation plan."
   - Incorporate feedback and revisions
   - Continue until explicit approval

## Design Structure
```markdown
# Design Document

## Overview
[High-level description]

## Architecture
[System architecture and patterns]

## Components and Interfaces
[Detailed component specifications]

## Data Models
[Data structures and validation]

## Error Handling
[Error scenarios and responses]

## Testing Strategy
[Testing approach and coverage]
```

## Next Phase
After approval, proceed to `/spec-tasks`.
