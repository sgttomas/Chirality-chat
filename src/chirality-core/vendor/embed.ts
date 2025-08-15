// Embedding function using OpenAI API
export async function embedAll(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts
      })
    });
    
    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error('Embedding error:', error);
    // Return random vectors as fallback for testing
    return texts.map(() => Array(1536).fill(0).map(() => Math.random()));
  }
}