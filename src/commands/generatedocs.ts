import { Argv } from 'yargs'
import fs from 'fs'
import { logger, newLine } from '../logger'
import { DirectoryTree } from '../core/DirectoryTree'

interface GenerateDocsArgv {
  path: string
}

export const command = 'generatedocs'
export const describe = 'Generates the documentation of the codebase'
export const aliases = ['g']

export function builder(yargs: Argv<GenerateDocsArgv>): Argv {
  return yargs
  // .option('path', {
  //   alias: 'p',
  //   type: 'string',
  //   describe: 'Path to the project',
  //   demandOption: false,
  //   default: '.',
  // })
}

export async function handler() {
  // const { path } = argv
  // console.log('path ', path)

  // const ready = await logger.prompt(green(`Do you want to generate Docs?`), {
  //   type: 'confirm',
  // })
  // if (!ready) {
  //   logger.log(`No problem Bye.`)
  //   return
  // }

  const dirPath =
    (await logger.prompt('path to ur project', {
      type: 'text',
    })) || '.'

  newLine(1)

  if (!fs.existsSync(dirPath)) {
    console.error(`The path "${dirPath}" does not exist.`)
    process.exit(1)
  }

  // generateTreeDiagrahm(dirPath)

  const dirTree = new DirectoryTree(dirPath)
  dirTree.generateTree()
  dirTree.display()

  // const dirInfo = fs.readdirSync(path)
  // console.log(dirInfo)

  // logger.log('')
  // logger.log(`Generating Docs. API_KEY=${green(bold(API_KEY))}`)

  // await logger.prompt('This is gonna cost a lot of credits.', {
  //   type: 'select',
  //   options: [
  //     {
  //       label: '👍',
  //       value: '👍',
  //       hint: 'Yes i rich 🤑',
  //     },
  //     {
  //       label: '👎',
  //       value: '👎',
  //       hint: 'No i poor 🥲',
  //     },
  //   ],
  // })

  // logger.log('')
  // logger.log('Please wait...')

  // logger.log('')
  // logger.log(`${green(bold('DOCS GENERATED in {path}'))}, Ciao!`)
}
