import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkgJson = path.join(__dirname, '../package.json')
const pkg = JSON.parse(await fs.readFile(pkgJson, 'utf8'))

const year = new Date().getFullYear()

function getBanner(pluginFilename) {
    return `/*!
  *                                                                
  * (  _\`\\                                   ( )_  _               
  * | |_) ) _   _  _ _    _ _      __   _ __ | ,_)(_)  ___     _   
  * | ,__/'( ) ( )( '_\`\\ ( '_\`\\  /'__\`\\( '__)| |  | |/' _ \`\\ /'_\`\\ 
  * | |    | (_) || (_) )| (_) )(  ___/| |   | |_ | || ( ) |( (_) )
  * (_)    \`\\___/'| ,__/'| ,__/'\`\\____)(_)   \`\\__)(_)(_) (_)\`\\___/'
  *               | |    | |                                       
  *               (_)    (_)                                       
  * 
  * Puppertino${pluginFilename ? ` ${pluginFilename}` : ''} v${pkg.version} (${pkg.homepage})
  * Copyright 2021-${year} ${pkg.author}
  * Licensed under MIT (https://github.com/codedgar/Puppertino/blob/main/LICENSE)
  */`
}

export default getBanner