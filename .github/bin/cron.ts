#!/usr/bin/env -S deno run -A

import { $, P, chalk, log, path } from '../lib/deps.ts'

const root = await $ `git rev-parse --show-toplevel`.text()
$.cd(root)

const Code = {
  OK: `${chalk.bgBlue.black('   OK   ')} `,
  UPDATE: `${chalk.bgAnsi256(34).black(' UPDATE ')} `,
  ERROR: `${chalk.bgAnsi256(160).whiteBright('  FAIL  ')} `,
  CACHED: `${chalk.bgAnsi256(129).whiteBright(' CACHED ')} `,
  WHITELIST: `${chalk.bgAnsi256(34).black(' WHITELIST ')} `,
}

async function readFile(path: string) {
  const lines = await $ `cat ${path}`.lines()
  const uniq = [...new Set(lines)]
  return uniq
    .filter(str => str !== '')
    .filter(str => !str.includes('#'))
}

async function stat(path: string) {
  let stat
  try {
    stat = await Deno.stat(path)
  }
  catch (error) {}
  return stat
}

// log('Available statuses:')
// log(Code.CACHED)
// log(Code.ERROR)
// log(Code.OK)
// log(Code.UPDATE)
// log()

async function download(list: string[], {
  to = 'blocklists'
}) {
  await P.mapLimit(list, 2, async (feed, _i) => {
    const fname = path.parse(feed).base

    // Filter out update frequency
    let updateFreq = await $ `rg --no-line-number --no-filename --only-matching '# Update Frequency:.(.*)' -r '$1' ${to}/${fname}`.noThrow().stdout('piped').stderr('piped').text()
    updateFreq = updateFreq.trim()
    updateFreq = (/day|hour/.test(updateFreq)) ? '1 hour' : updateFreq
    updateFreq = (/min|day|hour/.test(updateFreq)) ? updateFreq : '1 hour'

    // Stats:start
    const stat1 = await stat(`${to}/${fname}`)
    const start = performance.now()

    // Fetch
    const res = await $ `mkdir -p ${to}; cd ${to}; timeout -s SIGINT 60s bkt --cwd --discard-failures --ttl=${updateFreq} -- ${root}/.github/bin/dl ${feed}`
      .noThrow().captureCombined()


    // TODO: Verify that the file looks ok

    // Stats:stop
    const time = ((performance.now() - start) / 1000).toFixed(2).padEnd(8)
    const stat2 = await stat(`${to}/${fname}`)

    // File is cached => mtimeDiff == 0
    const mtimeDiff = Number(stat2?.mtime) - Number(stat1?.mtime)

    // Some pretty output/debug
    if (res?.code !== 0)
      log(Code.ERROR, time, updateFreq.padEnd(10), feed, res?.code, res.combined.trim())
    else
      if (Number(stat1?.mtime) > 0 && mtimeDiff === 0)
        log(Code.CACHED, time, updateFreq.padEnd(10), feed)
      else if (Number(stat1?.mtime) > 0 && mtimeDiff !== 0)
        log(Code.UPDATE, time, updateFreq.padEnd(10), feed)
      else
        log(Code.OK, time, updateFreq.padEnd(10), feed)
  })
}

/**
 * Remove private bogons (should be done in router or separate list)
 */
async function filterWhitelist(dir = '.') {
  $.cd(dir)
  const files = await $ `fd '.ipset|.netset' --max-depth=1 .`.noThrow().lines()

  await P.mapLimit(files, 8, async (file, _i) => {
    const start = performance.now()
    const lines1 = await $ `sh -c "wc -l < ${file}"`.noThrow().text()

    // Upstream bugfix: .ipset files contains no cidr prefix
    if (file.includes('.ipset'))
      await $ `${root}/.github/bin/iprange-filter ${file} ${root}/whitelists/private_bogons.netset --print-single-ips`
    else
      await $ `${root}/.github/bin/iprange-filter ${file} ${root}/whitelists/private_bogons.netset`

    const lines2 = await $ `sh -c "wc -l < ${file}"`.noThrow().text()
    const linediff = Number(lines1) - Number(lines2)

    const time = ((performance.now() - start) / 1000).toFixed(2).padEnd(5)
    log(Code.WHITELIST, time, '[bogons]', `${file.replace('./', '')}`, linediff)
  })
}

/*
 * Main
 */
const blocklists = await readFile('./.github/bin/source.blocklists.txt')
const countries_ipip = await readFile('./.github/bin/source.countries-ipip.txt')

await download(blocklists, {
  to: '.'
})

log()
log()

await $`cat /tmp/timeout.txt`.noThrow().text()

log()
log()

await download(countries_ipip, {
  to: './ipip_country'
})

log()
log()

await filterWhitelist(root)
