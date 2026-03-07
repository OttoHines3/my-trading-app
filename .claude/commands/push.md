Stage all changes, create a commit with a descriptive message, and push to the current branch on GitHub.

Steps:
1. Run `git status` and `git diff --staged` and `git diff` to see all changes.
2. Run `git log --oneline -5` to match the repo's commit message style.
3. Stage the relevant files (avoid .env, credentials, or large binaries).
4. Write a concise commit message summarizing the changes (1-2 sentences, focus on "why").
5. End the commit message with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
6. Push to the remote on the current branch.
7. Print the result and confirm success.