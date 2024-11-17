import { Argv } from 'yargs'
import fs from 'fs'
import { logger, newLine } from '../logger'
import { DirectoryTree } from '../core/DirectoryTree'
import { docGenController } from '../controllers/docgen.controller'
import { green, red, bold, cyan } from 'picocolors'
import { deleteDirectory } from '../utils/dirIo'

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
  const dirPath =
    (await logger.prompt('path to ur project', {
      type: 'text',
    })) || '.'

  newLine(1)

  if (!fs.existsSync(dirPath)) {
    console.error(`The path "${dirPath}" does not exist.`)
    process.exit(1)
  }

  // THISSSS
  const dirTree = new DirectoryTree(dirPath)
  dirTree.generateTree()
  newLine(1)
  dirTree.displayTree()
  // dirTree.displayTreeDSA()
  newLine(1)

  const confirmGenerate = await logger.prompt(
    `Do you want to generate docs for the above files ? \n` +
    `  previously generated documentation at path ${cyan(dirTree.outDir)} will be deleted \n` +
    red(bold('  MAKE SURE NODEMODULES IS NOT THERE.')),
    {
      type: 'confirm',
    },
  )
  if (!confirmGenerate) {
    logger.log(`No problem Bye.`)
    return
  }

  deleteDirectory(dirTree.outDir)

  logger.log(`Generating Docs. API_KEY=${green(bold(process.env.GEMINI_API_KEY))}`)

  docGenController(dirTree)

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
