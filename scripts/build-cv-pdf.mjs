import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

// Dependency-free, text-searchable PDF generated from the same checked-in CV data.
const cv = JSON.parse(await readFile(resolve("app/src/cv/data.json"), "utf8"));
const target = resolve("docs/cv/Mohanad-Almashharawi-CV.pdf");
const W = 595.28, H = 841.89, left = 46, right = W - 46;
const pages = [];
let ops = [], y = H - 53;
const clean = (str) => String(str).replace(/[–—]/g, " - ").normalize("NFKD").replace(/[^\x20-\x7e]/g, " ").replace(/\s+/g," ").trim();
const esc = (str) => clean(str).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
const ink = "0.11 0.19 0.32", muted = "0.29 0.38 0.49", blue = "0.06 0.38 0.78";
function text(str, x, y0, size = 10, font = "F1", color = ink) {
  ops.push(color+" rg BT /"+font+" "+size+" Tf 1 0 0 1 "+x.toFixed(2)+" "+y0.toFixed(2)+" Tm ("+esc(str)+") Tj ET");
}
function line(x1,y1,x2,y2,color="0.84 0.89 0.94"){ ops.push(color+" RG 0.7 w "+x1+" "+y1+" m "+x2+" "+y2+" l S"); }
function rect(x,y0,w,h,color){ops.push(color+" rg "+x+" "+y0+" "+w+" "+h+" re f");}
function header(first=false){
  rect(0,H-20,W,20,blue);
  text("MOHANAD ALMASHHARAWI",left,H-55,first?23:17,"F2",blue);
  text("GIS ENGINEER  |  FULL-STACK WEB DEVELOPER",left,H-75,10,"F2",ink);
  if(first)text(cv.location+"  |  "+cv.phone+"  |  "+cv.email,left,H-94,9,"F1",muted);
  line(left,H-(first?112:93),right,H-(first?112:93));
  y = H-(first?139:119);
}
function newPage(first=false) {
  if(ops.length) pages.push(ops.join("\n"));
  ops=[];
  header(first);
}
function ensure(height) {if(y-height<56)newPage();}
function section(name){
  if (name === "Selected projects" && y < 240) newPage();
  ensure(85); y-=6; text(name.toUpperCase(),left,y,12,"F2",blue); y-=9;line(left,y,right,y);y-=13;
}
function wrap(str,limit=95) {
  const words=clean(str).split(" ");
  const result=[];let current="";
  for(const word of words){if((current+" "+word).trim().length>limit){if(current)result.push(current);current=word;}else current=(current+" "+word).trim();}
  if(current)result.push(current);
  return result;
}
function paragraph(str,indent=0,size=9.25){
  const lines=wrap(str,Math.floor(100*(10/size))-(indent?5:0));
  ensure(lines.length*14+5);
  for(const l of lines){text(l,left+indent,y,size,"F1",muted);y-=14;}
  y-=3;
}
function entry(title,meta,bullets=[]) {
  const groups=bullets.map(s=>wrap(s,99));
  const lineCount=groups.reduce((sum,group)=>sum+group.length,0);
  ensure(42+lineCount*12);
  text(title,left,y,10.5,"F2",ink);y-=16;
  text(meta,left,y,9,"F1",blue);y-=17;
  for(const group of groups){
    for(let i=0;i<group.length;i++){
      text((i===0?"- ":"  ")+group[i],left+7+(i>0?7:0),y,8.8,"F1",muted);
      y-=12;
    }
  }
  y-=7;
}
newPage(true);
section("Professional profile");
paragraph(cv.summaryEn);
section("Professional experience");
for(const x of cv.experience){entry(x.roleEn,x.companyEn+"  |  "+x.periodEn,x.detailsEn);}
section("Selected projects");
for(const x of cv.projects){entry(x.titleEn,x.label,[x.descriptionEn]);}
section("Core technical skills");
for(const group of cv.skills){ensure(33);text(group.titleEn,left,y,10.5,"F2",ink);y-=15;paragraph(group.items.join("  |  "),0,8.6);}
section("Education & certification");
for(const ed of cv.education){entry(ed.degreeEn,ed.schoolEn,[ed.detailEn]);}
paragraph(cv.certificateEn);
section("Languages & links");
paragraph("Arabic: Native. English: Professional working proficiency.");
paragraph("GitHub: "+cv.github);
paragraph("LinkedIn: "+cv.linkedin);
pages.push(ops.join("\n"));
const objects = [null];
function obj(body) {objects.push(body);return objects.length-1;}
const catalogId=obj("");
const pagesId=obj("");
const regularId=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const boldId=obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const pageIds=[];
for(const content of pages){
  const bytes=Buffer.from(content,"ascii");
  const streamId=obj("<< /Length "+bytes.length+" >>\nstream\n"+content+"\nendstream");
  const pageId=obj("<< /Type /Page /Parent "+pagesId+" 0 R /MediaBox [0 0 "+W+" "+H+"] /Resources << /Font << /F1 "+regularId+" 0 R /F2 "+boldId+" 0 R >> >> /Contents "+streamId+" 0 R >>");
  pageIds.push(pageId);
}
objects[pagesId]="<< /Type /Pages /Kids ["+pageIds.map(id=>id+" 0 R").join(" ")+"] /Count "+pageIds.length+" >>";
objects[catalogId]="<< /Type /Catalog /Pages "+pagesId+" 0 R >>";
let output="%PDF-1.4\n";
const offsets=[0];
for(let i=1;i<objects.length;i++){offsets[i]=Buffer.byteLength(output,"ascii");output+=i+" 0 obj\n"+objects[i]+"\nendobj\n";}
const xref=Buffer.byteLength(output,"ascii");
output+="xref\n0 "+objects.length+"\n0000000000 65535 f \n";
for(let i=1;i<objects.length;i++)output+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
output+="trailer\n<< /Size "+objects.length+" /Root "+catalogId+" 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
await mkdir(dirname(target),{recursive:true});
await writeFile(target,Buffer.from(output,"ascii"));
console.log("Generated "+pageIds.length+"-page searchable CV PDF: "+target);
