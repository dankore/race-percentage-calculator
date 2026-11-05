# Roadmap

Planned work, roughly in order. Each item is tracked as a GitHub issue.

## Quality

- [ ] **Unit tests for the calculator** (weights across three generations, rounding, totals) and for the DNA kit parsers, using small made-up sample files for each vendor.
- [ ] **End-to-end tests** with Playwright for the calculator, story cards and DNA import, run in CI before deploy.
- [ ] **Upgrade to Tailwind CSS 4** and drop the separate Tailwind watch step.
- [ ] **Accessibility pass** for the chart (text alternative), the drop zone and the generation toggle.

## Features

- [ ] **More DNA kit formats** (FamilyTreeDNA, Living DNA) and clearer errors when a file can't be read.
- [ ] **Shareable result links** that reopen the same family tree.
- [ ] **Spanish and French translations.**
- [ ] **More blog guides** on reading DNA results and building a family tree.

## Android and release

- [ ] **Play Store release of the Android app** (version 3 targets Android 16).
- [ ] **Automated Lighthouse check in CI** so scores stay at 100.
