# Release Checklist

## SEO Indexing Verification

Before shipping production changes:

1. Inspect the live HTML source of the exact audited URL and verify whether a robots meta tag is present.
2. Confirm no blocking `X-Robots-Tag` response header is returned for indexable pages.
3. Confirm `/robots.txt` is crawl-allowing for public pages.
4. Re-run PageSpeed on the intended canonical route (not on experimental noindex routes).
