import { GoogleGenerativeAI } from '@google/generative-ai'

export const geminiModel = async (pre: string, input: string, post: string) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const finalPrompt = `
  ${pre}  
  
  ${input}
  
  ${post}
  `

  const result = await model.generateContent(finalPrompt)
  return result.response
}
