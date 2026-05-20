# Agent Instructions
Use this file when an AI coding agent edits the generated documentation PR.
## Documentation Source
- The docs source lives in `apps/docs`.
- `docs.json` is the Docs Cloud configuration for publishing, previews, and content roots.
- Keep every page grounded in README, package metadata, source exports, CLI help, environment examples, or existing docs.
## Generated Docs Map
- /docs - Better Auth Docs Discord Bot
- /docs/installation - Installation
- /docs/quickstart - Quickstart
- /docs/configuration - Configuration
- /docs/configuration/environment - Environment Variables
- /docs/features - Features
- /docs/features/ai-responses - AI Responses
- /docs/features/conversation-memory - Conversation Memory
- /docs/features/documentation-lookup - Documentation Lookup
- /docs/features/messaging-bot - Messaging Bot
## Editing Rules
- Prefer reader-facing task explanations over source inventories.
- Do not add commands, flags, environment variables, routes, imports, or framework names unless they are present in the repository.
- If you add or rename a page, keep its frontmatter title and description accurate and make sure the navigation ordering still includes it.
- Avoid analyzer language such as generated from, source evidence, implementation map, source surface, or detected in files.
## Verification
- Build the docs site with `cd apps/docs && pnpm install && pnpm build` before handing off a docs PR.
- Open `/docs` and at least one generated leaf page to confirm the sidebar and page content match the PR.
