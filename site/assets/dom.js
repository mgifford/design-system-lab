export function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
export async function loadJson(filename){const response=await fetch(`data/${filename}`,{cache:'no-cache'});if(!response.ok)throw new Error(`Could not load ${filename}: ${response.status}`);return await response.json()}
export function candidateLink(slug){return `compare.html?component=${encodeURIComponent(slug)}`}
