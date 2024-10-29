import prompt from './prompt.json'
import llmModel from '../../llm'

export const docGenAgent = async (inputPrompt: string): Promise<string> => {
  const output = await llmModel(prompt.pre, inputPrompt, prompt.post)
  return output.text()
}
