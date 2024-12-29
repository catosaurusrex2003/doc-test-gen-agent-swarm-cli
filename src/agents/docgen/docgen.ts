// import prompt from './prompt.json'
import llmModel from '../../llm'

type childrenContent = {
  fileName: string
  content: string
} | undefined

export const docGenAgent = async (
  fileName: string,
  fileContent: string,
  childrenContent: childrenContent[],
): Promise<string> => {
  const childrenPrompt = childrenContent
    .map((child) => {
      return `### ${child?.fileName}
    ${child?.content}`
    })
    .join('\n')
  const output = await llmModel(`
    ### ${fileName}    
    ${fileContent} 
    
    
    Below files might be helpfull
    ${childrenPrompt}
    
    generate a markdown documentation for the file: ${fileName}. Return only the markdown part of the documentation.
    `)
  return output.text()
}
