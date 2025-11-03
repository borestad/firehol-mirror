# firehol-mirror (almost)

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/borestad/firehol-mirror/ci.yml?style=for-the-badge)
![GitHub repo size](https://img.shields.io/github/repo-size/borestad/firehol-mirror?style=for-the-badge)
[![Visitors](https://api.visitorbadge.io/api/combined?path=https%3A%2F%2Fgithub.com%2Fborestad%2Ffirehol-mirror&label=HITS&countColor=%23007EC5)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Fborestad%2Ffirehol-mirror)
![LICENSE](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

**Goals / Why?**

- Removed all `private` ips
- Auto archives all `old/deprecated` blocklists (older than 1 month)
- Proper `TTL to avoid spamming` https://iplists.firehol.org
- `Fix inconsistencies` between .netset (contains subnets) and .ipset (contain
  single ips)
- git is a much `more efficient protocol` for fetching text files
- Be able to make `statical analysis` and `prevent false positives`
- Detect which `blocklists are lagging behind`
- Because it's `fun`

> All credits goes to firehol & maintainers of these blocklists
