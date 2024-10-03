import { Argv } from 'yargs'
import { logger } from '../logger'
import { bold, green } from 'picocolors'

interface GreetingArgv {}

export const command = 'generatedocs'
export const describe = 'Generates the documentation of the codebase'
export const aliases = ['g']

export function builder(yargs: Argv<GreetingArgv>): Argv {
  return yargs
}

export async function handler() {
  const ready = await logger.prompt(green(`Do you want to generate Docs?`), {
    type: 'confirm',
  })
  if (!ready) {
    logger.log(`No problem Bye.`)
    return
  }

  const API_KEY = await logger.prompt('Please give ur API key', {
    type: 'text',
  })

  // logger.log(`Hello, ${green(bold(username))}!`)

  logger.log("")
  logger.log(`Generating Docs. API_KEY=${green(bold(API_KEY))}`)

  await logger.prompt('This is gonna cost a lot of credits.', {
    type: 'select',
    options: [
      {
        label: '👍',
        value: '👍',
        hint: 'Yes i rich 🤑',
      },
      {
        label: '👎',
        value: '👎',
        hint: 'No i poor 🥲',
      },
    ],
  })
  
  logger.log("")
  logger.log('Please wait...')

  logger.log("")
  logger.log(`${green(bold("DOCS GENERATED in {path}"))}, Ciao!`)
}
