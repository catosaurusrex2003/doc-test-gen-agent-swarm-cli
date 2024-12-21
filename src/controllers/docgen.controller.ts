import { DependencyGraph } from 'src/core/DependencyGraph'
import { docGenAgent } from '../agents/docgen/docgen'
import { createMarkdownFile, readFile } from '../utils/fileIo'
import { DependencyTree } from '../core/DependencyTree'

export const docGenController = (depgraph: DependencyGraph) => {
  depgraph.traverseTreeWithCallback(async (node) => {
    if (node.docGenerated) {
      console.log(`already generated: ${node.name} path: ${node.path}`)
      return
    }
    console.log(`generating for  name: ${node.name} path: ${node.path}`)

    node.docGenerated = true
    // const content = await readFile(node.path)
    // if (!content) return
    // const llmOutput = await docGenAgent(content)
    // createMarkdownFile(llmOutput, node.docPath)
  })
}
