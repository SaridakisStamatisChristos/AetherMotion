import { RetryableDirectorError, type Director } from './director.js'

/** Optional Gemini generateContent transport. No credential or network call at module load. */
export function gemini(model:string,key:string,maxTokens:number,transport:typeof fetch=fetch):Director {
  if(!key || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(model) || !Number.isInteger(maxTokens) || maxTokens<128 || maxTokens>32768)
    throw new Error('Set GEMINI_API_KEY, select a valid model and use a token budget of 128–32768 per attempt')
  return {async generate(prompt,schema) {
    let response:Response
    try {
      response=await transport('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(45000),
        body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],
          generationConfig:{maxOutputTokens:maxTokens,responseMimeType:'application/json',responseJsonSchema:schema}})})
    } catch {throw new RetryableDirectorError('Gemini request timed out or failed in transit')}
    if(!response.ok) {
      const message='Gemini HTTP '+response.status+' for model '+model
      if(response.status===429 || response.status>=500) throw new RetryableDirectorError(message)
      throw new Error(message+'; check key, model access and structured-output support')
    }
    const json=await response.json()
    const candidate=json.candidates?.[0]
    if(candidate?.finishReason==='MAX_TOKENS') throw new Error('Gemini reached the configured output token limit; increase --tokens or shorten the brief')
    if(candidate?.finishReason!=='STOP') throw new Error('Gemini returned no complete storyboard: '+(candidate?.finishReason ?? 'empty response'))
    return {text:candidate.content.parts.filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text ?? '').join(''),usage:json.usageMetadata}
  }}
}
