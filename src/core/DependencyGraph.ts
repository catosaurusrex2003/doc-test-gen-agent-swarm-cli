import * as fs from 'fs'
import * as path from 'path'
import { bold, green, cyan, gray, red } from 'picocolors'
import { newLine } from '../logger'
import { readFile } from '../utils/fileIo'

class DependencyNode {
  name: string
  path: string
  imports: string[] = []
  children: DependencyNode[] = []
  visited: boolean = false
  docGenerated: boolean = false
  docPath: string

  constructor(name: string, filePath: string, outDir: string) {
    this.name = name
    this.path = filePath
    const ext = path.extname(filePath)
    this.docPath = path.join(outDir, filePath.slice(0, -ext.length) + '.md')
  }

  addImport(importPath: string) {
    if (!this.imports.includes(importPath)) {
      this.imports.push(importPath)
    }
  }
}

export class DependencyGraph {
  root: DependencyNode
  nodeMap: Map<string, DependencyNode> = new Map()
  outDir: string
  ignorePaths: string

  constructor(rootPath: string, outDir: string = 'docs', ignorePaths: string = '') {
    this.root = new DependencyNode(path.basename(rootPath), rootPath, outDir)
    this.outDir = outDir
    this.ignorePaths = ignorePaths
  }

  private extractImports(fileContent: string): string[] {
    const importRegex = /import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]+\})|(?:\w+))\s+from\s+['"]([^'"]+)['"]/g
    const imports: string[] = []
    let match

    while ((match = importRegex.exec(fileContent)) !== null) {
      if (match[1]) imports.push(match[1])
    }

    return imports
  }

  private resolveImportPath(currentFilePath: string, importPath: string): string {
    // Handle node_modules imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return path.resolve(path.dirname(currentFilePath), importPath)
    }
    return importPath
  }

  async buildGraph(currentNode: DependencyNode): Promise<void> {
    if (currentNode.visited) return
    currentNode.visited = true

    // Add to node map to track unique nodes
    this.nodeMap.set(currentNode.path, currentNode)

    try {
      const fileContent = await readFile(currentNode.path)

      // Extract imports
      const imports = this.extractImports(fileContent)

      for (const importPath of imports) {
        try {
          // Resolve full path of import
          const resolvedImportPath = this.resolveImportPath(currentNode.path, importPath)

          // Add possible file extensions
          const possiblePaths = [
            resolvedImportPath,
            `${resolvedImportPath}.js`,
            `${resolvedImportPath}.ts`,
            `${resolvedImportPath}.jsx`,
            `${resolvedImportPath}.tsx`,
            path.join(resolvedImportPath, 'index.js'),
            path.join(resolvedImportPath, 'index.ts'),
          ]

          // Find first existing path
          const existingPath = possiblePaths.find((p) => fs.existsSync(p))
          if (existingPath) {
            // check if should be ignored
            if (new RegExp(this.ignorePaths).test(existingPath)) {
              console.log(gray(`ignoring path : ${existingPath}`))
              continue
            }

            // Check if node already exists
            let importNode = this.nodeMap.get(existingPath)
            if (!importNode) {
              importNode = new DependencyNode(path.basename(existingPath), existingPath, this.outDir)

              // Recursively build graph for imported file
              await this.buildGraph(importNode)
            }

            // Add import to current node
            currentNode.addImport(existingPath)

            // Add to children if not already present
            if (!currentNode.children.includes(importNode)) {
              currentNode.children.push(importNode)
            }
          }
        } catch (importError) {
          console.error(red(`Error processing import ${importPath}: ${importError}`))
        }
      }
    } catch (error) {
      console.error(red(`Error reading file ${currentNode.path}: ${error}`))
    }
  }

  // Async method to start building the graph from root
  async generateGraph(): Promise<DependencyNode> {
    await this.buildGraph(this.root)
    console.log(cyan('Generated dependency graph'))
    // this.displayGraph()
    return this.root
  }

  async traverseTreeWithCallback(callback: (node: DependencyNode) => Promise<void>): Promise<void> {
    // a map to store nodes by their level
    const levelMap = new Map<number, DependencyNode[]>()

    // Helper function to populate levelMap using BFS
    const buildLevelMap = (root: DependencyNode) => {
      const queue: { node: DependencyNode; level: number }[] = [{ node: root, level: 0 }]
      let maxLevel = 0

      while (queue.length > 0) {
        const { node, level } = queue.shift()!

        // Create array for this level if it doesn't exist
        if (!levelMap.has(level)) {
          levelMap.set(level, [])
        }

        // Add node to its level
        levelMap.get(level)!.push(node)
        maxLevel = Math.max(maxLevel, level)

        // Add children to queue with increased level
        for (const child of node.children) {
          queue.push({ node: child, level: level + 1 })
        }
      }

      return maxLevel
    }

    // SIMULATE PROGRESS
    // await this.simulateGraphProgress(this.root, 2000)

    // Build the level map and get max level
    const maxLevel = buildLevelMap(this.root)

    // Process levels from bottom to top
    for (let level = maxLevel; level >= 0; level--) {
      const nodesAtLevel = levelMap.get(level) || []

      // Process all nodes at current level in parallel
      try {
        await Promise.all(
          nodesAtLevel.map(async (node) => {
            if (node.docGenerated) {
              console.log(`Already generated: ${node.name} path: ${node.path} ${green('hit')} `)
              return
            }
            try {
              await callback(node)
              node.docGenerated = true

              // EITHER SIMULATE PROGRESS OR PRINT
              this.printGraphProgress(this.root)
              // await this.simulateGraphProgress(this.root, 2000)
            } catch (err) {
              console.log(red(`Failed to process node ${node.path} at level ${level}`))
              console.error(err)
            }
          }),
        )
      } catch (err) {
        console.log(red(`Failed to process level ${level}`))
        console.error(err)
      }
    }
  }

  // Display dependency graph
  displayGraph(): void {
    console.log(bold(green('Dependency Graph:')))
    this.printGraph(this.root)
  }

  private printGraph(node: DependencyNode, indent: string = '', visited: Set<string> = new Set()): void {
    if (visited.has(node.path)) return
    visited.add(node.path)

    console.log(`${indent}${green(node.name)}`)

    // Print imports
    node.imports.forEach((imp) => {
      console.log(`${indent}  ↳ ${cyan(path.basename(imp))}`)
    })

    // Recursively print children
    node.children.forEach((child) => {
      this.printGraph(child, indent + '  ', visited)
    })
  }

  private printGraphProgress(node: DependencyNode, indent: string = '', visited: Set<string> = new Set()): void {
    if (visited.has(node.path)) return
    visited.add(node.path)

    console.log(`${indent}${node.docGenerated ? gray(node.name) : green(node.name)}`)

    // Print imports
    node.imports.forEach((imp) => {
      console.log(`${indent}  ↳ ${path.basename(imp)}`)
    })

    // Recursively print children
    node.children.forEach((child) => {
      this.printGraphProgress(child, indent + '  ', visited)
    })
  }

  private async simulateGraphProgress(
    node: DependencyNode,
    pause: number = 2000,
    indent: string = '',
    visited: Set<string> = new Set(),
  ): Promise<void> {
    console.clear()
    this.printGraphProgress(node, indent, visited)
    const sleep = (ms: number): Promise<void> => {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
    await sleep(pause)
  }

  public generateMermaidGraph(): string {
    const visited = new Set<string>()
    const edges: string[] = []
    const nodes: string[] = []

    const traverse = (node: DependencyNode) => {
      if (visited.has(node.path)) return
      visited.add(node.path)

      // Add node
      const sanitizedName = node.name.replace(/[^a-zA-Z0-9]/g, '_')
      nodes.push(`${sanitizedName}["${node.name}"]`)

      // Add edges for imports
      for (const importPath of node.imports) {
        const importNode = this.nodeMap.get(importPath)
        if (importNode) {
          const importName = importNode.name.replace(/[^a-zA-Z0-9]/g, '_')
          edges.push(`${sanitizedName} --> ${importName}`)
          traverse(importNode)
        }
      }

      // Traverse children
      for (const child of node.children) {
        traverse(child)
      }
    }

    traverse(this.root)

    return ['graph TD', ...nodes, ...edges].join('\n')
  }
}
