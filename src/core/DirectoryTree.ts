import * as fs from 'fs'
import * as path from 'path'
import { bold, green, cyan, gray, red } from 'picocolors'
import { newLine } from '../logger'

class TreeNode {
  name: string
  children: TreeNode[]
  docGenerated: boolean
  path: string
  docPath: string

  constructor(name: string, filePath: string, outDir: string) {
    this.name = name
    this.children = []
    this.docGenerated = Math.random() < 0.5
    this.path = filePath
    const ext = path.extname(filePath)
    this.docPath = path.join(outDir, filePath.slice(0, -ext.length) + '.md')
  }

  addChild(child: TreeNode): void {
    this.children.push(child)
  }
}

export class DirectoryTree {
  root: TreeNode
  outDir: string

  constructor(
    private dirPath: string,
    outDir: string = 'docs',
  ) {
    this.root = new TreeNode(path.basename(dirPath) || dirPath, dirPath, outDir)
    this.outDir = outDir
  }

  generateTree(): TreeNode {
    this.populateTree(this.root, this.dirPath)
    console.log(cyan('generated source tree'))
    return this.root
  }

  private populateTree(node: TreeNode, dirPath: string): void {
    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const childNode = new TreeNode(item, itemPath, this.outDir)
      node.addChild(childNode)

      if (fs.statSync(itemPath).isDirectory()) {
        this.populateTree(childNode, itemPath)
      }
    }
  }

  displayTree(): void {
    console.log(bold(green('Directory structure !')))
    newLine(1)
    this.printTree(this.root)
    newLine(1)
  }

  printTree(node: TreeNode, indent: string = '', isLast: boolean = false): void {
    const connector = isLast ? '└── ' : '├── '
    console.log(
      `${indent}${connector}${node.name == '.' ? 'root' : node.docGenerated ? green(node.name) : gray(node.name)}`,
    )
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i] as TreeNode
      const isLast = i == node.children.length - 1

      this.printTree(child, indent + '    ', isLast)
    }
  }

  displayTreeDSA(): void {
    console.log(bold(green('Directory structure with DSA !')))
    newLine(1)
    this.printTreeDSA(this.root)
    newLine(1)
  }

  printTreeDSA(node: TreeNode, indent: string = '', isLast: boolean = false): void {
    // const connector = isLast ? '└── ' : '├── '
    console.log(node)
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i] as TreeNode
      const isLast = i == node.children.length - 1

      this.printTreeDSA(child, indent + '    ', isLast)
    }
  }

  async traverseTreeWithCallback(node: TreeNode, callback: (node: TreeNode) => Promise<void>): Promise<void> {
    // will be used to generate doc or tests depending on the clalback provided to it.
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i] as TreeNode
      this.traverseTreeWithCallback(child, callback)
    }
    try {
      await callback(node)
      node.docGenerated = true
    } catch (err) {
      console.log(red(`failed to generate doc for ${node.path}`))
    }
  }
}
