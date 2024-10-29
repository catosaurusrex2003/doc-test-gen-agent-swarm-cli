import * as fs from 'fs'
import * as path from 'path'

// Function to generate the tree structure for a given directory
export const generateTreeDiagrahm = (dirPath: string, indent: string = ''): void => {
  try {
    const items = fs.readdirSync(dirPath)

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as string
      const itemPath = path.join(dirPath, item)
      const isLastItem = i === items.length - 1

      const connector = isLastItem ? '└── ' : '├── '
      console.log(indent + connector + item)

      if (fs.statSync(itemPath).isDirectory()) {
        const nextIndent = indent + (isLastItem ? '    ' : '│   ')
        generateTreeDiagrahm(itemPath, nextIndent)
      }
    }
  } catch (err) {
    console.error(`Error reading ${dirPath}: ${err}`)
  }
}


export const deleteDirectory = (dirPath: string): void => {
  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
      if (err) {
          console.error(`Error deleting ${dirPath}: ${err.message}`);
      } else {
          console.log(`Directory ${dirPath} deleted successfully.`);
      }
  });
}

