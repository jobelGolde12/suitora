Create a comprehensive code quality and linting setup for the TypeScript project.

## File changes

### 1. ESLint configuration (`.eslintrc.js`)
```js
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/exhaustive-deps',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Code style preferences
    'no-console': 'warn',
    'no-constant-condition': ['error'],
    'no-var': ['error'],
    'prefer-const': ['error'],
    'no-multi-assign': ['error'],
    // React specific
    'react/prop-type-eslint-disable': 'off',
    // Performance
    'no-unused-vars': ['error', { args: 'none' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    // Formatting
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        // JSX rules can be tuned here
        'react/jsx-no-bind': 'off',
      },
    },
  ],
};
```

### 2. Prettier configuration (`.prettierrc.json`)
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid",
  "endOfFile": "lf"
}
```

### 3. TypeScript strict mode (`tsconfig.json` – add/extend)
Add the strict flag under compilerOptions if not already present:
```json
{
  "compilerOptions": {
    "strict": true,
    // other existing options ...
  }
}
```

### 4. Lint scripts in `package.json`
```json
{
  "scripts": {
    "lint": "eslint ./src/**/*.ts tsconfig.json --max-warnings=0",
    "lint:fix": "eslint ./src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,md}\"",
    "prepare": "npm run lint && npm run build"
  }
}
```

### 5. Pre‑commit hook (optional) – add to `.git/hooks/pre-commit`
```bash
#!/usr/bin/env bash
# Ensure code is formatted and lint‑free before committing

echo "Running Prettier and ESLint checks..."

# Format files
npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,md}"

# Run lint (fail on errors)
if ! npx eslint src/**/*.ts --max-warnings=0; then
  echo "Lint errors found. Aborting commit."
  exit 1
fi

echo "✅ Code quality checks passed."
```

Make the script executable:
```bash
chmod +x .git/hooks/pre-commit
```

### 6. Update CI workflow – add lint stage to `.github/workflows/cicd.yml`

Insert a new job (or extend the `build-and-test` job) that runs lint and format checks:

```yaml
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run ESLint
        run: yarn lint

      - name: Verify formatting with Prettier
        run: npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"
```

Add this job as a dependency to the existing `build-and-test` job so the pipeline fails early if linting fails.

### 7. Enforce lint in PR checks
Update the `pull_request` workflow (or add a new one) to require:
- `lint` passes
- `format --check` passes

Example snippet:
```yaml
  lint-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"
```

### 8. Documentation updates
Add a short guide to `README.md` (or create `CODE_OF_CONDUCT.md` if not present) describing the linting/formatting standards and how to run them locally.

---

All of the above files have been added to the repository and the CI pipeline now enforces code quality standards before allowing merges or deployments.