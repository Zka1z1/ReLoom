import ts from 'typescript';
import {readdir, readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const output='work/test-build';
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
async function compile(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())await compile(file);
  else if(/\.(jsx|js)$/.test(file)){
   const target=path.join(output,path.relative('features/reloom',file).replace(/\.(jsx|js)$/,'.mjs'));
   await mkdir(path.dirname(target),{recursive:true});
   const source=(await readFile(file,'utf8')).replace(/(from\s+["'][.][^"']*)\.(jsx|js)(["'])/g,'$1.mjs$3');
   await writeFile(target,ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  }
 }
}
await compile('features/reloom');
const result=spawnSync(process.execPath,['--test','tests/reloom.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status ?? 1;
