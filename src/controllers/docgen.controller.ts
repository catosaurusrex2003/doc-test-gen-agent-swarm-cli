import { DependencyGraph } from 'src/core/DependencyGraph'
import { docGenAgent } from '../agents/docgen/docgen'
import { createMarkdownFile, readFile, readFileSync } from '../utils/fileIo'

export const docGenController = (depgraph: DependencyGraph) => {
  depgraph.traverseTreeWithCallback(async (node) => {
    if (node.docGenerated) {
      console.log(`already generated: ${node.name} path: ${node.path}`)
      return
    }
    console.log(`generating for  name: ${node.name} path: ${node.path}`)

    const content = await readFile(node.path)
    if (!content) return
    const childrenContent = node.children.map((child) => {
      if (!child.docGenerated) return
      const childContent = readFileSync(child.path)
      if (!childContent) return
      return { fileName: child.path, content: childContent }
    })
    const llmOutput = await docGenAgent(node.path, content, childrenContent)
    createMarkdownFile(llmOutput, node.docPath)

    node.docGenerated = true
  })
}
