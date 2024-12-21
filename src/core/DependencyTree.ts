import * as fs from 'fs'
import * as path from 'path'
import { bold, green, cyan, gray, red } from 'picocolors'
import { newLine } from '../logger'

// the problem with a tree implementation is that each node is unique even though it is repeated.
// and maintaining a trakc of the files which i have gone through will be difficult and overkill
// and hence the docs will be generated multiple times for a file which is being used in many places

// graph solves this problem.

// Regular expressions for different import syntaxes
const IMPORT_PATTERNS = [
  /import\s+.*\s+from\s+['"]([^'"]+)['"]/g, // ES6 imports
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // CommonJS require
  /import\s*\(['"]([^'"]+)['"]\)/g, // Dynamic imports
]

class DependencyNode {
  name: string
  children: DependencyNode[]
  path: string
  importPaths: string[]
  isCircular: boolean
  docGenerated: boolean

  constructor(name: string, filePath: string) {
    this.name = name
    this.children = []
    this.path = filePath
    this.importPaths = []
    this.isCircular = false
    this.docGenerated = false
  }

  addChild(child: DependencyNode): void {
    this.children.push(child)
  }
}

export class DependencyTree {
  root: DependencyNode
  private visitedFiles: Set<string>
  private baseDir: string
  outDir: string

  constructor(entryPath: string, outDir: string = 'docs') {
    this.baseDir = path.dirname(entryPath)
    this.root = new DependencyNode(path.basename(entryPath), entryPath)
    this.visitedFiles = new Set()
    this.outDir = outDir
  }

  generateTree(): DependencyNode {
    this.populateTree(this.root)
    console.log(cyan('Generated dependency tree'))
    return this.root
  }

  private extractImports(fileContent: string): string[] {
    const imports = new Set<string>()

    IMPORT_PATTERNS.forEach((pattern) => {
      const matches = fileContent.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          imports.add(match[1])
        }
      }
    })

    return Array.from(imports)
  }

  private resolveImportPath(importPath: string, currentFilePath: string): string {
    // Handle relative paths
    if (importPath.startsWith('.')) {
      const absolutePath = path.resolve(path.dirname(currentFilePath), importPath)

      // Try different extensions if none provided
      const extensions = ['.js', '.jsx', '.ts', '.tsx']
      if (path.extname(absolutePath) === '') {
        for (const ext of extensions) {
          const pathWithExt = absolutePath + ext
          if (fs.existsSync(pathWithExt)) {
            return pathWithExt
          }
        }
      }

      return absolutePath
    }

    // Handle node_modules imports (simplified)
    // You might want to enhance this to handle node_modules resolution properly
    return path.resolve(this.baseDir, 'node_modules', importPath)
  }

  private resolveFileWithExtension(filePath: string): string | null {
    // List of possible extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

    // If the file already has an extension, try that first
    if (path.extname(filePath) && fs.existsSync(filePath)) {
      return filePath
    }

    // Try each extension
    for (const ext of extensions) {
      const pathWithExt = filePath + ext
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt
      }
    }

    return null
  }

  private populateTree(node: DependencyNode): void {
    console.log('populate tree on node', node)
    if (this.visitedFiles.has(node.path)) {
      //   node.isCircular = true
      return
    }

    this.visitedFiles.add(node.path)

    try {
      const resolvedPath = this.resolveFileWithExtension(node.path)
      console.log('resolvedPath with extensions ', resolvedPath)
      if (resolvedPath === null) {
        console.log(red(`File not found ext: ${resolvedPath}`))
        return
      }

      if (!fs.existsSync(resolvedPath)) {
        console.log(red(`File doesnt exist: ${resolvedPath}`))
        return
      }

      const content = fs.readFileSync(resolvedPath, 'utf-8')
      const imports = this.extractImports(content)

      node.importPaths = imports
      node.path = resolvedPath

      for (const importPath of imports) {
        const resolvedPath = this.resolveImportPath(importPath, node.path)
        const childNode = new DependencyNode(importPath, resolvedPath)
        node.addChild(childNode)
        this.populateTree(childNode)
      }
    } catch (error) {
      console.log(red(`Error processing ${node.path}: ${error}`))
    }
  }

  displayTree(): void {
    console.log(bold(green('Dependency Tree:')))
    newLine(1)
    this.printTree(this.root)
    newLine(1)
  }

  private printTree(node: DependencyNode | undefined, indent: string = '', isLast: boolean = false): void {
    const connector = isLast ? '└── ' : '├── '

    if (node == undefined) {
      console.log(`${indent}${connector}${node}`)
      return
    }

    const nodeDisplay = node.isCircular
      ? red(`${node.name} (circular)`)
      : node.importPaths.length > 0
        ? green(node.name)
        : gray(node.name)

    console.log(`${indent}${connector}${nodeDisplay}`)

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const childIsLast = i === node.children.length - 1
      this.printTree(child, indent + (isLast ? '    ' : '│   '), childIsLast)
    }
  }

  async traverseTreeBottomUpBFS(callback: (node: DependencyNode) => Promise<void>): Promise<void> {
    // Get all levels of the tree, bottom-up
    const levels = this.getLevelsBottomUp(this.root)

    // Process each level
    for (const level of levels) {
      // Process all nodes at current level in parallel
      await Promise.all(
        level.map(async (node) => {
          try {
            await callback(node)
          } catch (err) {
            console.log(red(`Failed to analyze ${node.path}: ${err}`))
          }
        }),
      )
    }
  }

  private getLevelsBottomUp(root: DependencyNode): DependencyNode[][] {
    const levels: DependencyNode[][] = []

    // Helper function to traverse the tree and assign levels
    const assignLevels = (node: DependencyNode, depth: number) => {
      // Create array for this level if it doesn't exist
      if (!levels[depth]) {
        levels[depth] = []
      }

      // Add node to its level
      levels[depth].push(node)

      // Process children at next level
      for (const child of node.children) {
        assignLevels(child, depth + 1)
      }
    }

    // Start assigning levels from root
    assignLevels(root, 0)

    // Reverse the array to get bottom-up order
    return levels.reverse()
  }

  // Example usage with level tracking
  async traverseTreeBottomUpBFSWithLevels(
    callback: (node: DependencyNode, level: number) => Promise<void>,
  ): Promise<void> {
    const levels = this.getLevelsBottomUp(this.root)

    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex]
      console.log(cyan(`Processing level ${levels.length - levelIndex - 1}`))

      if (level === undefined) {
        console.log(red(`Failed to analyze because level is undefined`))
        return
      }

      await Promise.all(
        level.map(async (node) => {
          try {
            await callback(node, levels.length - levelIndex - 1)
          } catch (err) {
            console.log(red(`Failed to analyze ${node.path}: ${err}`))
          }
        }),
      )
    }
  }
}
