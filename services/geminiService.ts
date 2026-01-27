import { GoogleGenAI, Type } from "@google/genai";
import { TokenData, AnalysisReport } from "../types";

// NOTE: In a real production app, this call would go through a backend proxy 
// to protect the API key. For this strict React task, we use the env var directly.
const getAIClient = () => {
    // Safety check for browser environment where process might be undefined
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

    if (!apiKey) {
        console.warn("API_KEY not found in environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeToken = async (token: TokenData): Promise<AnalysisReport | null> => {
    const ai = getAIClient();
    if (!ai) return null;

    const prompt = `
    Role: Senior Quantitative Crypto Analyst.
    Task: Analyze the following market data for token ${token.symbol}.
    Data: ${JSON.stringify(token)}
    
    Constraints:
    - Do NOT give financial advice.
    - Do NOT say "buy" or "sell".
    - Focus on volume anomalies, liquidity depth relative to market cap, and volatility.
    - Be technical and concise.
    
    Output Format: JSON matching the schema: { riskLevel, summary, keyFactors }.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        summary: { type: Type.STRING },
                        keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                tokenId: token.id,
                timestamp: new Date().toISOString(),
                ...data
            };
        }
        return null;
    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return null;
    }
};

export const generateMarketOverview = async (topTokens: TokenData[]): Promise<string> => {
     const ai = getAIClient();
     if (!ai) return "AI Service Unavailable";

     const summaryData = topTokens.slice(0, 5).map(t => ({ s: t.symbol, score: t.momentumScore, vol: t.volumeSpikeFactor }));
     
     const prompt = `
     Analyze this basket of top momentum tokens: ${JSON.stringify(summaryData)}.
     Summarize the current market sector rotation or sentiment in 2 sentences. Technical tone.
     `;

     try {
         const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: prompt,
         });
         return response.text || "Market analysis unavailable.";
     } catch (e) {
         return "Unable to generate market overview.";
     }
};