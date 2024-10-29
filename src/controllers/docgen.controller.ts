import { docGenAgent } from '../agents/docgen/docgen'
import { DirectoryTree } from '../core/DirectoryTree'
import { createMarkdownFile, readFile } from '../utils/fileIo'
import {blue} from "picocolors"

export const docGenController = (dirTree: DirectoryTree) => {
  dirTree.traverseTreeWithCallback(dirTree.root, async (node) => {
    if (node.children.length > 0) {
        // this means it is a folder
        return
    }

    console.log(`generating ${node.docPath}`)
    const content = await readFile(node.path)
    if (!content) return
    const llmOutput = await docGenAgent(content)
    createMarkdownFile(llmOutput, node.docPath)
  })
}
