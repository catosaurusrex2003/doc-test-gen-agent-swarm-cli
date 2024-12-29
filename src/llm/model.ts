import { GoogleGenerativeAI } from '@google/generative-ai'

export const geminiModel = async (prompt: string) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent(prompt)
  return result.response
}
