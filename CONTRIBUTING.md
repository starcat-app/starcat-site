# Contributing

Thank you for helping improve the Starcat website.

## Good Contributions

- Fix inaccurate or unclear public copy.
- Keep English and Simplified Chinese pages aligned.
- Improve accessibility, responsive behavior, SEO metadata, and browser compatibility.
- Correct blog posts, changelog rendering, public legal-page links, or static assets.
- Make focused improvements that can be reviewed without production credentials.

Product bugs, subscriptions, downloads, and application feature requests belong in [starcat-pro](https://github.com/starcat-app/starcat-pro/issues).

## Local Workflow

1. Fork this repository and create a focused branch.
2. Preview the affected surface with a local HTTP server.
3. Change only files required for the outcome.
4. Keep paired English and Chinese pages synchronized when public meaning changes.
5. Open a pull request with the affected URL, screenshots when visual output changes, and the checks you ran.

Example preview command:

```bash
python3 -m http.server 8765 --directory direct
```

## Required Boundaries

- Never commit `_local-admin/config.js`, `.env*`, `.dev.vars`, credentials, tokens, private keys, customer data, or production secrets.
- Keep Nginx configuration local-only.
- Do not add DMG files or generated download artifacts to Git.
- Do not run production or test deployment scripts as part of a contribution.
- Preserve `direct/appcast.xml` and `.well-known/apple-app-site-association` as public runtime contracts.
- Release-note content comes from the paired public changelogs in [starcat-pro](https://github.com/starcat-app/starcat-pro); do not invent release history here.
- Keep the `starcat-promo` markers intact so shared ecosystem branding remains recognizable.

## Validation

Run the checks relevant to your change:

```bash
git diff --check

for file in $(git ls-files '*.html'); do
  xmllint --html --noout "$file"
done

for file in $(git ls-files '*.json'); do
  jq empty "$file"
done

for file in $(git ls-files '*.js'); do
  node --check "$file"
done

for file in $(git ls-files '*.sh'); do
  bash -n "$file"
done

python3 -m py_compile direct/generate-changelog.py
```

If a required tool is unavailable, state that clearly in the pull request instead of claiming the check passed.
