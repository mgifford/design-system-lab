/* Reproducible evidence collector. No generated text is treated as human review.
   Requires real upstream assets, installed Playwright browsers, jsdom and Guidepup. */
import fs from 'node:fs';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {JSDOM} from 'jsdom';
import {virtual} from '@guidepup/virtual-screen-reader';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const built=JSON.parse(fs.readFileSync(path.join(root,'dist/data/build.json'),'utf8'));
if(!built.uswdsRealAssets)throw Error('Refusing to collect upstream comparison evidence from offline fallback. Install npm dependencies, then build:strict.');
const routes=JSON.parse(fs.readFileSync(path.join(root,'dist/data/routes.json'),'utf8'));
const reportDir=path.join(root,'reports/latest');fs.mkdirSync(reportDir,{recursive:true});
const port=4188,origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});
function esc(s){return String(s||'').replaceAll('\r',' ').replaceAll('\n',' ').replaceAll('|','\\|')}
function fileName(route){return route.replaceAll('/','--').replace(/\.html$/,'').replace(/[^a-zA-Z0-9-]/g,'-')+'.md'}
async function waitForServer(){for(let i=0;i<80;i++){try{const r=await fetch(origin+'/index.html');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('Evidence server did not start')}
async function virtualSpeech(html){const dom=new JSDOM(html,{pretendToBeVisual:true});
 globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.Node=dom.window.Node;globalThis.Element=dom.window.Element;globalThis.HTMLElement=dom.window.HTMLElement;globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
 try{await virtual.start({container:dom.window.document.body});let previous='',stuck=0;
 for(let i=0;i<140;i++){try{await virtual.next()}catch{break}let phrase=await virtual.lastSpokenPhrase()||'';stuck=phrase===previous?stuck+1:0;previous=phrase;if(stuck>=4)break}
 const log=await virtual.spokenPhraseLog();return log.map(s=>String(s));}
 finally{try{await virtual.stop()}catch{}dom.window.close()}
}
let browser;const pages=[];const generatedAt=new Date().toISOString();const runId=generatedAt.replaceAll(':','-').replaceAll('.','-');
let gitSha='unknown';try{gitSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}catch{}
try{await waitForServer();browser=await chromium.launch({headless:true});for(const route of routes){const entry={name:route,result:'not-tested',report:null};pages.push(entry);const page=await browser.newPage({viewport:{width:1280,height:850},colorScheme:'light'});try{
 const scriptErrors=[];page.on('pageerror',error=>scriptErrors.push(error.message));
 const response=await page.goto(origin+'/'+route,{waitUntil:'networkidle',timeout:20000});if(!response?.ok())throw Error(`HTTP ${response?.status()}`);
 const title=await page.title();const html=await page.content();const transcript=await virtualSpeech(html);if(transcript.length===0)throw Error('Guidepup virtual transcript was empty');
 const aria=await page.locator('[aria-expanded],[aria-live],[role],[aria-controls]').evaluateAll(els=>els.slice(0,100).map(e=>({tag:e.tagName.toLowerCase(),id:e.id||null,text:(e.textContent||'').trim().slice(0,85),role:e.getAttribute('role'),expanded:e.getAttribute('aria-expanded'),controls:e.getAttribute('aria-controls'),live:e.getAttribute('aria-live')})));
 const button=page.locator('.usa-accordion__button[aria-expanded="false"]').first();let interaction='not applicable';let afterTranscript=[];if(await button.count()){
 try{await button.focus();await page.keyboard.press('Enter');interaction=(await button.getAttribute('aria-expanded'))==='true'?'expanded with keyboard':'not observed to expand';afterTranscript=await virtualSpeech(await page.content())}catch(err){interaction=`interaction error: ${err.message}`}}
 const lines=[`# Evidence: ${route}`,'','**Automated observation only. Human review: pending.**','',`- Run: ${generatedAt}`,`- Source: USWDS ${built.uswdsVersion}, npm distribution`, `- Git revision: ${gitSha}`,`- Browser: ${browser.version()} / Chromium`, `- Page: ${origin}/${route}`,`- Page title: ${title}`,`- Keyboard interaction: ${interaction}`,`- Script errors observed: ${scriptErrors.length}`, '', '## What was tested', '', 'Page loaded in Chromium; DOM captured; virtual screen reader traversed a jsdom snapshot. Applicable first collapsed disclosure was activated with a real Playwright Enter keypress.', '', '## Guidepup virtual transcript', '', 'This is **not** actual VoiceOver, NVDA, JAWS, or user testing. Speech comes from a simulated accessibility interpretation of the DOM snapshot.', '',...transcript.map(p=>`- ${esc(p)}`),'','## Guidepup after keyboard expansion', '', ...(afterTranscript.length?afterTranscript.map(p=>`- ${esc(p)}`):['Not applicable, or post-interaction capture unavailable.']), '', '## ARIA inventory at load','','| Tag | ID | Role | Expanded | Controls | Live |','|---|---|---|---|---|---|',...aria.map(x=>`| ${esc(x.tag)} | ${esc(x.id)} | ${esc(x.role)} | ${esc(x.expanded)} | ${esc(x.controls)} | ${esc(x.live)} |`),'','## Limitations and review','','- No actual assistive-technology session was performed.','- Chromium-only collection; Firefox/WebKit tests are separate.','- Visual, forced-colors, zoom, and high-contrast outcomes require further evaluation.','- Automated observations do not demonstrate WCAG conformance.','- Human reviewer: **not assigned**.','','## Decision','','Pending human review. Do not infer an upstream recommendation.'];
 const target=fileName(route);fs.writeFileSync(path.join(reportDir,target),lines.join('\n')+'\n');entry.result='collected-not-reviewed';entry.report=target.replace('.md','.html');console.log(`Recorded ${route}: ${transcript.length} virtual phrases`);
 }catch(err){entry.result='failed: '+err.message;console.error(`FAILED ${route}: ${err.stack||err.message}`);}finally{await page.close()}}
}finally{await browser?.close();child.kill('SIGTERM')}
const succeeded=pages.filter(p=>p.result==='collected-not-reviewed').length;const failed=pages.length-succeeded;
const manifest={generated:true,runId,generatedAt,source:'@uswds/uswds 3.14.0 (npm)',gitSha,pages,succeeded,failed};
fs.writeFileSync(path.join(reportDir,'MANIFEST.json'),JSON.stringify(manifest,null,2));
const summary=['# Evidence summary','','**Automated collection, not a conformance or human acceptance statement.**','',`- Run: ${generatedAt}`,`- Git revision: ${gitSha}`,`- Source: ${manifest.source}`,`- Collected: ${succeeded} of ${pages.length} pages`,'', '| Page | Status | Evidence |','|---|---|---|',...pages.map(p=>`| ${p.name} | ${esc(p.result)} | ${p.report?`[Markdown](${p.report.replace('.html','.md')})`:'Not generated'} |`),'','## Method','', 'Playwright loaded all published pages using pinned USWDS assets. Each page was captured as rendered HTML; Guidepup traversed a virtual DOM snapshot. For disclosure fixtures a keyboard Enter was sent through Playwright and the resulting expanded attribute recorded. This transcript does not replicate actual assistive technologies.','', '## Not tested','','Human keyboard evaluation, actual screen reader operation, human review of dark mode, full WCAG conformance, real government implementation compatibility.','', '## Decision','','Pending maintainer review.'];
fs.writeFileSync(path.join(reportDir,'SUMMARY.md'),summary.join('\n')+'\n');
const historyDir=path.join(root,'reports','runs',runId);fs.mkdirSync(path.dirname(historyDir),{recursive:true});fs.cpSync(reportDir,historyDir,{recursive:true});
console.log(`Evidence collection: ${succeeded}/${pages.length}; ${failed} failures. Reports in ${reportDir}`);if(failed)process.exitCode=1;
