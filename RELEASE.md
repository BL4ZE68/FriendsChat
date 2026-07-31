Release checklist

1. Update changelog (high level changes since last release).
2. Bump version in package.json.
3. Create a tag and push it, or use GitHub Releases UI to draft a release.

Suggested release notes template:

- Added Supabase integration (auth, persistence, file uploads)
- Added realtime message subscriptions and conversation management
- Added GitHub Actions CI and Pages deployment
- UI: Direct chat modal and file upload support

How to create a release locally:

```bash
# bump version
npm version patch -m "Release %s [skip ci]\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
# push tag
git push --follow-tags
```

Or use GitHub UI: Releases -> Draft a new release -> attach changelog -> publish.
