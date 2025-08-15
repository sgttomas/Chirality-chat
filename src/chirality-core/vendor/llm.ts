// LLM call wrapper with strict JSON mode using Responses API
export async function callJSON(
  system: string, 
  user: string, 
  opts: { temperature: number; prior?: unknown }
) {
  // Build instructions for Responses API
  const instructions = [
    system,
    opts.prior ? `\nPrevious context: ${JSON.stringify(opts.prior)}` : '',
    '\nRespond with valid JSON only.'
  ].filter(Boolean).join('\n');
  
  const body = { 
    model: 'gpt-4.1-nano',
    instructions,
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: user }]
      }
    ],
    temperature: opts.temperature
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const text = data.output?.[0]?.content?.[0]?.text || '';
    
    try { 
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON. Model returned:', text);
      
      // Try to fix common JSON formatting issues
      let fixedText = text.trim();
      
      // Handle missing opening brace
      if (!fixedText.startsWith('{') && fixedText.includes('{"text":')) {
        const start = fixedText.indexOf('{"text":');
        fixedText = fixedText.substring(start);
      }
      
      // One structured retry: wrap content with best-effort braces slice
      const first = fixedText.indexOf('{');
      const last = fixedText.lastIndexOf('}');
      if (first >= 0 && last > first) { 
        try { 
          return JSON.parse(fixedText.slice(first, last + 1)); 
        } catch (retryError) {
          console.error('Retry parse also failed:', retryError);
        } 
      }
      throw new Error('Model did not return strict JSON triple');
    }
  } catch (error) {
    console.error('LLM call error:', error);
    throw error;
  }
}