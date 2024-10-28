import * as fs from 'fs'
import * as path from 'path'
import { bold, green, blue, gray } from 'picocolors'
import { newLine } from '../logger'

class TreeNode {
  name: string
  children: TreeNode[]
  docGenerated: boolean

  constructor(name: string) {
    this.name = name
    this.children = []
    this.docGenerated = Math.random() < 0.5
  }

  addChild(child: TreeNode): void {
    this.children.push(child)
  }
}

export class DirectoryTree {
  root: TreeNode

  constructor(private dirPath: string) {
    this.root = new TreeNode(path.basename(dirPath) || dirPath)
  }

  generateTree(): TreeNode {
    this.populateTree(this.root, this.dirPath)
    console.log(blue('generated source tree'))
    return this.root
  }

  private populateTree(node: TreeNode, dirPath: string): void {
    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const childNode = new TreeNode(item)
      node.addChild(childNode)

      if (fs.statSync(itemPath).isDirectory()) {
        this.populateTree(childNode, itemPath)
      }
    }
  }

  display(): void {
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
}
