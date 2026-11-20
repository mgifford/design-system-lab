import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fixtureHtml} from './components.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const vendor=path.join(root,'node_modules','@uswds','uswds','dist');
const requireUswds=process.argv.includes('--require-uswds');
const pkgFile=path.join(root,'node_modules','@uswds','uswds','package.json');
const installedVersion=fs.existsSync(pkgFile)?JSON.parse(fs.readFileSync(pkgFile,'utf8')).version:null;
const css=path.join(vendor,'css','uswds.min.css');
const js=path.join(vendor,'js','uswds.min.js');
const realAssets=installedVersion==='3.14.0'&&fs.existsSync(css)&&fs.existsSync(js);
const fileSha256=p=>fs.existsSync(p)?createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
if(requireUswds&&!realAssets)throw Error(`Strict build requires @uswds/uswds version 3.14.0 with dist CSS and JS. Installed: ${installedVersion||'none'}. Run npm install first.`);
const issues=JSON.parse(fs.readFileSync(path.join(root,'data','issues.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(root,'data','registry.json'),'utf8'));
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.cpSync(path.join(root,'site'),dist,{recursive:true});
const outData=path.join(dist,'data');fs.mkdirSync(outData,{recursive:true});
for(const file of ['registry.json','issues.json','review.json'])fs.copyFileSync(path.join(root,'data',file),path.join(outData,file));
if(realAssets){
 const dest=path.join(dist,'vendor','uswds');fs.mkdirSync(dest,{recursive:true});
 for(const folder of ['css','js','img','fonts']){const source=path.join(vendor,folder);if(fs.existsSync(source))fs.cpSync(source,path.join(dest,folder),{recursive:true})}
 const packageLicense=path.join(root,'node_modules','@uswds','uswds','LICENSE.md');
 if(fs.existsSync(packageLicense))fs.copyFileSync(packageLicense,path.join(dest,'LICENSE.md'));
 // An alternative package layout must not be silently accepted by strict build.
 if(!fs.existsSync(path.join(dest,'css','uswds.min.css'))||!fs.existsSync(path.join(dest,'js','uswds.min.js')))throw Error('Missing copied USWDS dist assets');
}
const fixtureDir=path.join(dist,'fixture');fs.mkdirSync(fixtureDir,{recursive:true});
for(const component of registry.components){for(const variant of ['baseline','experiment']){
 fs.writeFileSync(path.join(fixtureDir,`${component.slug}-${variant}.html`),fixtureHtml({component:component.slug,variant,realAssets}));
}}
// A generated evidence manifest must distinguish absent evidence from actual passes.
const manifestPath=path.join(root,'reports','latest','MANIFEST.json');
const evidence=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{generated:false,runId:null,pages:[],succeeded:0,failed:0};
fs.writeFileSync(path.join(outData,'evidence.json'),JSON.stringify(evidence,null,2));
fs.writeFileSync(path.join(outData,'build.json'),JSON.stringify({uswdsRealAssets:realAssets,uswdsVersion:realAssets?'3.14.0':null,generatedAt:new Date().toISOString(),components:registry.components.map(c=>c.slug),source:'@uswds/uswds@3.14.0',assetSha256:realAssets?{css:fileSha256(css),js:fileSha256(js)}:null,lockSha256:fileSha256(path.join(root,'package-lock.json'))},null,2));
const evDir=path.join(dist,'evidence','latest');fs.mkdirSync(evDir,{recursive:true});
const latest=path.join(root,'reports','latest');
if(fs.existsSync(latest)){
 for(const filename of fs.readdirSync(latest))if(filename.endsWith('.md')){const content=fs.readFileSync(path.join(latest,filename),'utf8');fs.copyFileSync(path.join(latest,filename),path.join(evDir,filename));
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${filename} | Evidence</title><link rel="stylesheet" href="../../assets/base.css"></head><body><main><p><a href="../../evidence.html">Back to evidence index</a></p><h1>${filename}</h1><pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:white;border:1px solid #aaa;padding:1.2rem">${content.replaceAll('&','&amp;').replaceAll('<','&lt;')}</pre></main></body></html>`;
 fs.writeFileSync(path.join(evDir,filename.replace(/\.md$/,'.html')),html);
 }
}
// Generate link inventory for built fixture smoke tests and evidence collection.
fs.writeFileSync(path.join(outData,'routes.json'),JSON.stringify(['index.html','compare.html','ideas.html','evidence.html','guide.html',...registry.components.flatMap(c=>['baseline','experiment'].map(v=>`fixture/${c.slug}-${v}.html`))],null,2));
console.log(`Built ${dist} (${realAssets?'real pinned USWDS 3.14.0':'OFFLINE ILLUSTRATION; no USWDS assets'}), ${registry.components.length*2} fixtures, ${issues.length} curated issues.`);
