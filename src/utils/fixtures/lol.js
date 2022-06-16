
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const maps = require('./maps.json')

fs.writeFileSync(`${__dirname}/mapNames.json`, JSON.stringify(maps.map(m=>m.name), null, 2), 'utf-8')
