# Suggested Commands

## Essential Development Commands

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Start development mode (with watch)
pnpm dev

# Build all packages
pnpm build

# Build specific package
cd packages/core && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
cd packages/core && pnpm test
```

### Code Quality

```bash
# Run all linting and type checking
pnpm check

# Type checking
pnpm typecheck

# Linting (TypeScript + Markdown)
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier (via ESLint)
pnpm lint:fix:ts
```

### Git Operations

```bash
# Check git status
git status

# View recent commits
git log --oneline -10

# Create feature branch
git checkout -b feat/feature-name

# Stage changes
git add .

# Commit with conventional format
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"
git commit -m "refactor: improve code structure"

# Push to remote
git push -u origin branch-name
```

### Monorepo Management

```bash
# Run command in all packages
pnpm -r <command>

# Run command in specific workspace
pnpm --filter @openapi-xcgen/core <command>

# Add dependency to specific package
pnpm --filter @openapi-xcgen/core add <package>

# List all workspaces
pnpm ls -r --depth 0
```

### System Utilities (macOS/Darwin)

```bash
# File operations
ls -la              # List files with details
find . -name "*.ts" # Find TypeScript files
grep -r "pattern"   # Search in files
rg "pattern"        # Fast search with ripgrep

# Process management
ps aux | grep node  # Find Node processes
lsof -i :3000      # Check port usage
```

### Development Workflow

1. Before starting work: `pnpm install && pnpm build`
2. During development: `pnpm dev` (in package directory)
3. Before committing: `pnpm check` (ensures lint, typecheck, and tests pass)
4. After changes: `pnpm test` to verify functionality
