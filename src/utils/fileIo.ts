import path from 'path'
import fs from 'fs'
import { cyan } from 'picocolors'

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

export const readPackageJsonMain = async (filePath: string): Promise<string> => {
  const content = await readFile(filePath)
  const obj = JSON.parse(content)
  return obj.main as string
}

export const gitignoreToRegex = async (filePath: string): Promise<string> => {
  const content = await readFile(filePath)
  const dirtyArr = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
  const regexParts = dirtyArr.map((pattern) => {
    // Escape regex special characters except "*"
    const escapedPattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
    // Replace "*" with ".*" for matching anything
    const regexPattern = escapedPattern.replace(/\*/g, '.*')
    // Allow matching anywhere in the path
    if (!pattern.endsWith('/')) {
      return `${regexPattern}`
    }
    return `${regexPattern}.*`
  })

  return regexParts.join('|')
}
