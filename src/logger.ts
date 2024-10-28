import { createConsola } from 'consola'

export const logger = createConsola({})

export const newLine = (n: number) => {
  for (let i = 0; i < n; i++) {
    console.log('\n')
  }
}
