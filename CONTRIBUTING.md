# Contributing

## Local setup

1. Install dependencies:

```bash
npm ci
```

2. Validate build, tests, and package:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
node ./bin/entirekit --help
```

## Pull request checklist

- Keep documentation aligned with the current TypeScript CLI behavior.
- Update docs when command behavior changes.
- Ensure `npm run pack:check` still includes expected files only.
