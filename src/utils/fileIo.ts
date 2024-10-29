import path from 'path'
import fs from 'fs'
import {cyan} from "picocolors"

export const createMarkdownFile = (content: string, destinationPath: string): void => {
  const dir = path.dirname(destinationPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFile(destinationPath, content, (err) => {
    if (err) {
      console.error(`Error writing to ${destinationPath}: ${err.message}`)
    } else {
      console.log(cyan(`Markdown file created at: ${destinationPath}`))
    }
  })
}

export const readFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        reject(`Error reading file at ${filePath}: ${err.message}`)
      } else {
        resolve(data)
      }
    })
  })
}


