This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages must follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```
feat(auth): add user login functionality
fix(db): resolve connection timeout issue
docs(readme): update installation instructions
refactor(api): simplify error handling logic
```

### Commit Validation

This project uses [commitlint](https://commitlint.js.org/) with [husky](https://typicode.github.io/husky/) to automatically validate commit messages. Invalid commit messages will be rejected.

## Changelog

This project maintains a [CHANGELOG.md](./CHANGELOG.md) file that tracks all notable changes. The changelog is automatically generated using [standard-version](https://github.com/conventional-changelog/standard-version).

### Generating a Release

To create a new release and update the changelog:

```bash
# Automatically determine version bump based on commits
pnpm run release

# Or specify the version type explicitly
pnpm run release:patch  # 0.1.0 -> 0.1.1
pnpm run release:minor  # 0.1.0 -> 0.2.0
pnpm run release:major  # 0.1.0 -> 1.0.0
```

This will:
1. Update the version in `package.json`
2. Generate/update `CHANGELOG.md` based on commit history
3. Create a git tag for the release
4. Commit all changes

After running the release command, push the changes and tags:

```bash
git push --follow-tags origin main
```
