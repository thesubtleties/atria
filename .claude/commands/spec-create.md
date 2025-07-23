# Spec Create Command

Create a new feature specification following the Kiro spec workflow.

## Usage
```
/spec-create <feature-name> [description]
```

## Instructions
You are helping create a new feature specification. Follow these steps:

1. **Create Directory Structure**
   - Create `.claude/specs/{feature-name}/` directory
   - Initialize empty requirements.md, design.md, and tasks.md files

2. **Parse Feature Description**
   - Take the feature name and optional description
   - Begin the requirements gathering phase immediately
   - Do not ask sequential questions - generate initial requirements

3. **Generate Initial Requirements**
   - Use the requirements template from `.claude/templates/requirements-template.md`
   - Create user stories in "As a [role], I want [feature], so that [benefit]" format
   - Write acceptance criteria in EARS format (WHEN/IF/THEN statements)
   - Consider edge cases and technical constraints

4. **Request User Approval**
   - Present the requirements document
   - Ask: "Do the requirements look good? If so, we can move on to the design."
   - Wait for explicit approval before proceeding

5. **Rules**
   - Only create ONE spec at a time
   - Always use kebab-case for feature names
   - Follow the exact EARS format for acceptance criteria
   - Do not proceed without explicit user approval

## Example
```
/spec-create user-authentication "Allow users to sign up and log in securely"
```

## Next Steps
After user approval, proceed to `/spec-design` phase.
