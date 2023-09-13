#!/usr/bin/env -S deno run -A

import { $ } from 'dax/mod.ts'

await $ `echo hello world`
