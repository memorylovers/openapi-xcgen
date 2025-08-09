# Task Completion Checklist

## When completing any coding task, always

### 1. Code Quality Checks

- [ ] Run linting: `pnpm lint`
- [ ] Fix any linting issues: `pnpm lint:fix`
- [ ] Run type checking: `pnpm typecheck`
- [ ] Ensure no TypeScript errors

### 2. Testing

- [ ] Run all tests: `pnpm test`
- [ ] Ensure all tests pass
- [ ] Add tests for new functionality
- [ ] Check test coverage if significant changes

### 3. Build Verification

- [ ] Run build: `pnpm build`
- [ ] Ensure build completes successfully
- [ ] Check that dist/ files are generated correctly

### 4. Documentation

- [ ] Update JSDoc comments for new/modified functions
- [ ] Update README if API changes
- [ ] Add inline comments for complex logic
- [ ] Update type definitions if needed

### 5. Code Review Preparation

- [ ] Review your own changes
- [ ] Ensure code follows project conventions
- [ ] Check for console.log statements to remove
- [ ] Verify error handling is appropriate

### 6. Final Verification

```bash
# Run the complete check suite
pnpm check
```

This command runs: lint, typecheck, and test

### 7. Git Hygiene (if committing)

- [ ] Stage only relevant files
- [ ] Write clear commit message following conventional commits
- [ ] Ensure no sensitive data in commits
- [ ] Verify branch is up to date with main

## Common Issues to Check

- Import paths use .js extension for local imports
- Error messages are descriptive and actionable
- No unused imports or variables
- Consistent naming conventions
- Proper error types thrown

## Package-Specific Checks

### For Core Package

- Ensure IR types are properly exported
- Verify parser handles edge cases
- Check transformer logic is complete

### For Generator Packages

- Generated code compiles in target language
- Output follows target language conventions
- All OpenAPI features are handled

## Important Notes

- Always run `pnpm check` before considering a task complete
- If any check fails, fix the issue before proceeding
- When in doubt, ask for the specific commands to run
