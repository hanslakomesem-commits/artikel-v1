const STOP = new Set((`yang dan di ke dari pada untuk dengan dalam ini itu adalah sebagai atau oleh akan telah dapat juga karena agar maka namun serta suatu tersebut menjadi lebih tidak ada antara bagi terhadap tentang yaitu yakni saat bila jika sudah masih sangat mereka kami kita saya ia dia para setiap sampai setelah sebelum melalui selama berupa tanpa ketika dimana sehingga merupakan dilakukan melakukan penelitian peneliti hasil berdasarkan data digunakan menggunakan memiliki mengenai terkait secara hal bagian adanya menjadi dibuat memperoleh memberikan menunjukkan diketahui mengetahui menurut bahwa terhadap`.split(/\s+/)));

const norm = s => (s || '').normalize('NFKC').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const upper = s => norm(s).toUpperCase();
const words = s => norm(s).toLowerCase().replace(/[^a-z0-9à-ÿ'’-]+/gi,' ').split(/\s+/).filter(x => x.length > 2 && !STOP.has(x));
const wc = s => (norm(s).match(/\b[\p{L}\p{N}’'-]+\b/gu) || []).length;

function isQuestionLike(t){
  const n=norm(t).toLowerCase();
  return /\?$/.test(n) || /^(bagaimana|apakah|mengapa|kenapa|siapa|kapan|dimana|di mana|sejauh mana)\b/.test(n.replace(/^\d+[.)]\s*/,''));
}
function isListSentence(t){
  const n=norm(t);
  return /^\d+[.)]\s+/.test(n) && (isQuestionLike(n) || wc(n) > 22);
}
function isHeadingLike(item){
  const t=norm(item.text); if(!t || t.length>180) return false;
  const u=t.toUpperCase();
  if(/^BAB\s+[IVXLCDM]+\b/.test(u)) return true;
  if(/^[A-Z]\s*[.)]\s+/.test(t) && wc(t) <= 16) return true;
  if(/^\d+(?:\.\d+){0,3}\s*[.)]?\s+/.test(t) && wc(t) <= 16 && !isListSentence(t)) return true;
  if(item.boldRatio >= .6 && wc(t) <= 16) return true;
  if(/^(PENDEKATAN DAN JENIS PENELITIAN|KEHADIRAN PENELITI|LOKASI PENELITIAN|SUMBER DATA|DATA PRIMER|DATA SEKUNDER|PROSEDUR PENGUMPULAN DATA|TEKNIK PENGUMPULAN DATA|STUDI KEPUSTAKAAN|STUDI LAPANGAN|DOKUMENTASI|WAWANCARA(?: TERSTRUKTUR| SEMI TERSTRUKTUR| TIDAK TERSTRUKTUR)?|OBSERVASI(?: NON[- ]PARTISIPAN)?|ANALISIS DATA|REDUKSI DATA|PENYAJIAN DATA|PENARIKAN KESIMPULAN|PENGECEKAN KEABSAHAN DATA|TRIANGULASI|TAHAP[- ]TAHAP PENELITIAN)$/i.test(t)) return true;
  return /^(PENDAHULUAN|METODE PENELITIAN|METODOLOGI PENELITIAN|HASIL DAN PEMBAHASAN|PEMBAHASAN|KESIMPULAN|PENUTUP|SARAN|DAFTAR PUSTAKA|ABSTRAK)$/i.test(t);
}
function headingLevel(item){
  const t=norm(item.text), u=t.toUpperCase();
  if(/^BAB\s+[IVXLCDM]+\b/.test(u) || /^(PENDAHULUAN|METODE PENELITIAN|HASIL DAN PEMBAHASAN|PEMBAHASAN|KESIMPULAN|DAFTAR PUSTAKA)$/i.test(t)) return 1;
  if(/^[A-Z]\s*[.)]\s+/.test(t)) return 2;
  if(/^\d+(?:\.\d+){0,3}\s*[.)]?\s+/.test(t) && !isListSentence(t)) return 3;
  if(/^(PENDEKATAN DAN JENIS PENELITIAN|KEHADIRAN PENELITI|LOKASI PENELITIAN|SUMBER DATA|PROSEDUR PENGUMPULAN DATA|TEKNIK PENGUMPULAN DATA|ANALISIS DATA|PENGECEKAN KEABSAHAN DATA|TAHAP[- ]TAHAP PENELITIAN)$/i.test(t)) return 2;
  if(/^(DATA PRIMER|DATA SEKUNDER|STUDI KEPUSTAKAAN|STUDI LAPANGAN|DOKUMENTASI|WAWANCARA(?: TERSTRUKTUR| SEMI TERSTRUKTUR| TIDAK TERSTRUKTUR)?|OBSERVASI(?: NON[- ]PARTISIPAN)?|REDUKSI DATA|PENYAJIAN DATA|PENARIKAN KESIMPULAN|TRIANGULASI)$/i.test(t)) return 3;
  return item.boldRatio >= .7 && wc(t) <= 14 ? 2 : 0;
}
function findIdx(items, regex, from=0, to=items.length){
  for(let i=from;i<Math.min(to,items.length);i++) if(regex.test(norm(items[i].text))) return i;
  return -1;
}
function findAny(items, patterns, from=0, to=items.length){
  for(const re of patterns){ const i=findIdx(items,re,from,to); if(i>=0) return i; }
  return -1;
}
function nextMajor(items, start, patterns){
  const hits=patterns.map(re=>findIdx(items,re,start+1)).filter(i=>i>=0); return hits.length?Math.min(...hits):items.length;
}
function extractMeta(items){
  const first=items.slice(0,90).filter(x=>x.type==='p' && norm(x.text));
  let title='';
  for(const it of first.slice(0,30)){
    const t=norm(it.text); const u=t.toUpperCase();
    if(wc(t)>=7 && t.length>50 && (t===u || it.boldRatio>.7) && !/SKRIPSI|PROPOSAL|OLEH|PROGRAM STUDI|FAKULTAS|UNIVERSITAS|NIM/.test(u)){
      if(t.length>title.length) title=t;
    }
  }
  if(!title) title=norm(first[0]?.text||'ARTIKEL ILMIAH');
  let author='';
  let oleh=findIdx(first,/^OLEH\s*:?$/i);
  if(oleh>=0){
    for(let i=oleh+1;i<Math.min(oleh+5,first.length);i++){
      const t=norm(first[i].text); if(t && !/^NIM\b/i.test(t)){ author=t; break; }
    }
  }
  if(!author){
    const nim=findIdx(first,/^NIM\b/i); if(nim>0) author=norm(first[nim-1].text);
  }
  let prodi=''; let univ=''; let year='';
  for(const it of first){
    const t=norm(it.text),u=t.toUpperCase();
    if(!prodi && /PROGRAM STUDI|PROGRAM STUDY|PRODI/.test(u)) prodi=t.replace(/^PROGRAM\s+STUDI\s*/i,'').trim();
    if(!univ && /UNIVERSITAS|INSTITUT|SEKOLAH TINGGI/.test(u)) univ=t;
    if(!year && /\b20\d{2}\b/.test(t)) year=(t.match(/\b20\d{2}\b/)||[])[0]||'';
  }
  author=author.toLowerCase().replace(/(^|\s|[.'’-])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase());
  return {title,author,prodi,univ,year};
}
function buildGlobalKeywords(items, meta){
  const paras=items.filter(x=>x.type==='p' && wc(x.text)>=8).map(x=>words(x.text));
  const df=new Map(); for(const toks of paras){ for(const t of new Set(toks)) df.set(t,(df.get(t)||0)+1); }
  const n=Math.max(1,paras.length); const score=new Map();
  paras.forEach(toks=>{ const tf=new Map(); toks.forEach(t=>tf.set(t,(tf.get(t)||0)+1)); for(const [t,c] of tf) score.set(t,(score.get(t)||0)+c*Math.log((n+1)/(1+(df.get(t)||1)))); });
  for(const t of words(meta.title)) score.set(t,(score.get(t)||0)+20);
  return [...score.entries()].sort((a,b)=>b[1]-a[1]).slice(0,80).map(x=>x[0]);
}
function paragraphScore(item, kwSet, kind='general'){
  const t=norm(item.text), toks=words(t); if(wc(t)<18) return -5;
  let s=0; toks.forEach(x=>{if(kwSet.has(x)) s+=1;});
  const n=wc(t); s += n>=45&&n<=180?5:n>250?-3:1;
  if(kind==='discussion' && /temuan|hasil penelitian|menunjukkan|sesuai dengan|sejalan|kontribusi|strategi|dampak|berdasarkan/.test(t.toLowerCase())) s+=6;
  if(kind==='method' && /pendekatan|kualitatif|kuantitatif|informan|wawancara|observasi|dokumentasi|analisis data|lokasi/.test(t.toLowerCase())) s+=5;
  if(kind==='intro' && /fenomena|masalah|kondisi|penting|menarik|berdasarkan|latar|potensi|namun/.test(t.toLowerCase())) s+=3;
  return s;
}
function chooseOrdered(items, candidates, targetWords, kwSet, kind, mustIdx=[]){
  const allowed=candidates.filter(i=>i>=0&&i<items.length&&items[i].type==='p'&&!isHeadingLike(items[i])&&wc(items[i].text)>=12);
  const scored=allowed.map(i=>({i,s:paragraphScore(items[i],kwSet,kind),w:wc(items[i].text)})).sort((a,b)=>b.s-a.s);
  const chosen=new Set(mustIdx.filter(i=>allowed.includes(i))); let total=[...chosen].reduce((a,i)=>a+wc(items[i].text),0);
  for(const x of scored){ if(total>=targetWords) break; if(chosen.has(x.i)) continue; chosen.add(x.i); total+=x.w; }
  return [...chosen].sort((a,b)=>a-b);
}
function contiguousParagraphs(items,start,end){ const out=[]; for(let i=Math.max(0,start);i<Math.min(end,items.length);i++) if(items[i].type==='p'&&norm(items[i].text)) out.push(i); return out; }
function subsectionGroups(items,start,end){
  const groups=[]; let cur=null;
  for(let i=start;i<end;i++){
    const it=items[i]; if(it.type!=='p'||!norm(it.text)) continue;
    if(isHeadingLike(it) && headingLevel(it)>=2){ if(cur) groups.push(cur); cur={heading:i,items:[]}; }
    else if(cur) cur.items.push(i);
  }
  if(cur) groups.push(cur); return groups;
}
function chooseMethod(items,start,end,target,kwSet,maxGroups=3){
  const groups=subsectionGroups(items,start,end);
  const pri=/pendekatan|jenis penelitian|kehadiran|lokasi|sumber data|informan|pengumpulan data|wawancara|observasi|dokumentasi|analisis data/i;
  const picked=[]; let total=0;
  let usedGroups=0;
  for(const g of groups){
    const h=norm(items[g.heading].text); if(!pri.test(h)) continue;
    if(usedGroups>=maxGroups) break; usedGroups++;
    picked.push({index:g.heading,role:'subheading',source:'Metode'});
    const maxP=/pendekatan|lokasi|kehadiran/i.test(h)?2:1;
    let count=0;
    for(const i of g.items){ if(wc(items[i].text)<15) continue; picked.push({index:i,role:'body',source:'Metode'}); total+=wc(items[i].text); count++; if(count>=maxP||total>=target) break; }
    if(total>=target) break;
  }
  if(total<Math.min(220,target*.6)){
    const cand=contiguousParagraphs(items,start,end).filter(i=>!isHeadingLike(items[i]));
    const more=chooseOrdered(items,cand,target-total,kwSet,'method');
    for(const i of more) if(!picked.some(x=>x.index===i)) picked.push({index:i,role:'body',source:'Metode'});
  }
  return picked.sort((a,b)=>a.index-b.index);
}
function chooseDiscussion(items,start,end,target,kwSet){
  // Dalam banyak skripsi, kata "PEMBAHASAN" muncul sebagai judul BAB IV dan muncul lagi
  // setelah Paparan Data/Temuan. Untuk artikel, ambil kemunculan TERAKHIR agar tidak
  // memasukkan sejarah objek, visi-misi, daftar informan, dan paparan mentah.
  let hits=[]; for(let i=start;i<end;i++){const t=norm(items[i]?.text||'');if(/^PEMBAHASAN$/i.test(t)||/^HASIL\s+DAN\s+PEMBAHASAN$/i.test(t))hits.push(i);}
  let pStart=hits.length?hits[hits.length-1]:start;
  const groups=subsectionGroups(items,pStart+1,end);
  if(!groups.length){
    const cand=contiguousParagraphs(items,pStart+1,end).filter(i=>!isHeadingLike(items[i]));
    return chooseOrdered(items,cand,target,kwSet,'discussion').map(i=>({index:i,role:'body',source:'Pembahasan'}));
  }
  const per=Math.max(180,Math.floor(target/Math.max(1,groups.length)));
  const out=[]; let total=0;
  for(const g of groups){
    const ht=norm(items[g.heading].text); if(/^PEMBAHASAN$/i.test(ht)) continue;
    out.push({index:g.heading,role:'subheading',source:'Pembahasan'});
    const picked=chooseOrdered(items,g.items,per,kwSet,'discussion',g.items.slice(0,1));
    for(const i of picked){out.push({index:i,role:'body',source:'Pembahasan'}); total+=wc(items[i].text);}
    if(total>=target) break;
  }
  return out.sort((a,b)=>a.index-b.index);
}
function chooseBiblio(items,start,maxRefs,selectedText){
  if(start<0) return [];
  let end=items.length;
  for(let i=start+1;i<items.length;i++){const t=norm(items[i].text);if(/^(LAMPIRAN\b|PERNYATAAN KEASLIAN|BIODATA|RIWAYAT HIDUP)/i.test(t)){end=i;break;}}
  const refs=[]; for(let i=start+1;i<end;i++){ const t=norm(items[i].text); if(items[i].type==='p'&&wc(t)>=4&&( /\b(?:19|20)\d{2}\b/.test(t)||/^UNDANG[- ]UNDANG/i.test(t))) refs.push(i); }
  const body=norm(selectedText).toLowerCase();
  const scored=refs.map((i,pos)=>{
    const t=norm(items[i].text); const lead=(t.split(/[,.]/)[0]||'').toLowerCase();
    const surname=lead.split(/\s+/).filter(Boolean).slice(-1)[0]||'';
    let s=0; if(surname.length>3 && body.includes(surname)) s+=10; s+=Math.max(0,4-pos*.03); return {i,s,pos};
  }).sort((a,b)=>b.s-a.s||a.pos-b.pos);
  return scored.slice(0,maxRefs).sort((a,b)=>a.pos-b.pos).map(x=>({index:x.i,role:'bibliography',source:'Daftar Pustaka'}));
}

export function analyzeThesis(doc, opts={}){
  const items=doc.items; const meta=extractMeta(items); const kw=buildGlobalKeywords(items,meta); const kwSet=new Set(kw.slice(0,55));
  const idx={};
  // Hindari entri Daftar Isi: utamakan heading ABSTRAK yang benar-benar berdiri sendiri.
  idx.abstract=findAny(items,[/^ABSTRAK$/i]);
  if(idx.abstract<0) idx.abstract=findAny(items,[/^ABSTRAK\b/i],Math.floor(items.length*.08));
  const contentAnchor=idx.abstract>=0?idx.abstract+1:Math.floor(items.length*.12);
  idx.bab1=findAny(items,[/^BAB\s+I(?:\s|$)/i,/^PENDAHULUAN$/i],contentAnchor);
  idx.bab2=findAny(items,[/^BAB\s+II(?:\s|$)/i],Math.max(contentAnchor,idx.bab1+1));
  idx.bab3=findAny(items,[/^BAB\s+III(?:\s|$)/i,/^METODE\s+PENELITIAN$/i,/^METODOLOGI\s+PENELITIAN$/i],Math.max(contentAnchor,idx.bab2+1,idx.bab1+1));
  idx.bab4=findAny(items,[/^BAB\s+IV(?:\s|$)/i,/^HASIL\s+DAN\s+PEMBAHASAN$/i],Math.max(contentAnchor,idx.bab3+1));
  idx.bab5=findAny(items,[/^BAB\s+V(?:\s|$)/i,/^PENUTUP$/i],Math.max(contentAnchor,idx.bab4+1));
  idx.biblio=findAny(items,[/^DAFTAR\s+PUSTAKA$/i],Math.max(contentAnchor,idx.bab5+1));
  const confidence=[idx.abstract,idx.bab1,idx.bab3,idx.bab4,idx.bab5,idx.biblio].filter(i=>i>=0).length/6;
  return {meta,keywords:kw,idx,confidence,itemsCount:items.length,wordCount:items.reduce((a,x)=>a+wc(x.text),0)};
}

export function generatePlan(doc, analysis, opts={}){
  const items=doc.items, idx=analysis.idx, kwSet=new Set(analysis.keywords.slice(0,55));
  const mode=opts.mode||'contoh';
  const budgets=mode==='ringkas'?{intro:450,method:300,discussion:800,conclusion:320,refs:10}:mode==='lengkap'?{intro:1100,method:650,discussion:1900,conclusion:700,refs:25}:{intro:760,method:420,discussion:1200,conclusion:520,refs:15};
  const sections=[];
  // Abstrak: pertahankan utuh hingga BAB I, tetapi batasi bagian non-abstrak.
  if(idx.abstract>=0){
    const end=idx.bab1>idx.abstract?idx.bab1:Math.min(items.length,idx.abstract+12);
    const arr=[]; for(let i=idx.abstract+1;i<end;i++){ if(items[i].type==='p'&&norm(items[i].text)){ if(/^KATA\s+PENGANTAR$/i.test(norm(items[i].text))) break; arr.push({index:i,role:/^KATA\s*KUNCI\b/i.test(norm(items[i].text))?'keywords':'body',source:'Abstrak'}); } }
    sections.push({id:'abstract',title:'ABSTRAK',items:arr});
  }
  // Pendahuluan: konteks/latar belakang, bukan rumusan/fokus/tujuan.
  if(idx.bab1>=0){
    const endBase=[idx.bab2,idx.bab3].filter(i=>i>idx.bab1).sort((a,b)=>a-b)[0]||items.length;
    let start=findAny(items,[/^(?:A\s*[.)]\s*)?(KONTEKS|LATAR\s+BELAKANG)\s+PENELITIAN/i,/^LATAR\s+BELAKANG/i],idx.bab1+1,endBase);
    if(start<0) start=idx.bab1;
    let end=findAny(items,[/^(?:B\s*[.)]\s*)?(FOKUS|RUMUSAN)\s+(PENELITIAN|MASALAH)/i,/^(?:C\s*[.)]\s*)?TUJUAN\s+PENELITIAN/i],start+1,endBase);
    if(end<0) end=endBase;
    const cand=contiguousParagraphs(items,start+1,end).filter(i=>!isHeadingLike(items[i]));
    const must=[...cand.slice(0,2),...cand.slice(-2)];
    const chosen=chooseOrdered(items,cand,budgets.intro,kwSet,'intro',must);
    sections.push({id:'intro',title:'PENDAHULUAN',items:chosen.map(i=>({index:i,role:'body',source:'Pendahuluan'}))});
  }
  // Metode
  if(idx.bab3>=0){ const end=idx.bab4>idx.bab3?idx.bab4:(idx.bab5>idx.bab3?idx.bab5:items.length); sections.push({id:'method',title:'METODE PENELITIAN',items:chooseMethod(items,idx.bab3+1,end,budgets.method,kwSet,mode==='lengkap'?6:3)}); }
  // Pembahasan
  if(idx.bab4>=0){ const end=idx.bab5>idx.bab4?idx.bab5:(idx.biblio>idx.bab4?idx.biblio:items.length); sections.push({id:'discussion',title:'PEMBAHASAN',items:chooseDiscussion(items,idx.bab4+1,end,budgets.discussion,kwSet)}); }
  // Kesimpulan & saran
  if(idx.bab5>=0){
    const end=idx.biblio>idx.bab5?idx.biblio:items.length;
    let k=findAny(items,[/^KESIMPULAN$/i,/^KESIMPULAN\s+DAN\s+SARAN$/i],idx.bab5,end); if(k<0) k=idx.bab5;
    const cand=contiguousParagraphs(items,k+1,end);
    const arr=[]; let total=0;
    for(const i of cand){ const t=norm(items[i].text); if(/^DAFTAR\s+PUSTAKA$/i.test(t)) break; const head=isHeadingLike(items[i]); arr.push({index:i,role:head?'subheading':'body',source:'Kesimpulan'}); total+=wc(t); if(total>=budgets.conclusion && /^SARAN$/i.test(t)===false && total>budgets.conclusion*1.35) break; }
    sections.push({id:'conclusion',title:'KESIMPULAN',items:arr});
  }
  const selectedIndices=sections.flatMap(s=>s.items.map(x=>x.index));
  const selectedText=selectedIndices.map(i=>items[i]?.text||'').join(' ');
  if(idx.biblio>=0) sections.push({id:'biblio',title:'DAFTAR PUSTAKA',items:chooseBiblio(items,idx.biblio,budgets.refs,selectedText)});
  const totalWords=sections.reduce((a,s)=>a+s.items.reduce((b,x)=>b+wc(items[x.index]?.text||''),0),0);
  return {sections,totalWords,budgets,mode};
}

export function diagnostics(doc, analysis, plan){
  const notes=[];
  if(analysis.confidence<.84) notes.push('Sebagian struktur BAB tidak terdeteksi otomatis. Periksa panel struktur sebelum membuat artikel.');
  if(!analysis.meta.author) notes.push('Nama penulis belum terdeteksi. Isi manual pada Data Artikel.');
  if(plan.totalWords<1800) notes.push('Draft terdeteksi terlalu singkat. Gunakan mode Lengkap atau periksa struktur skripsi.');
  if(!plan.sections.some(s=>s.id==='discussion'&&s.items.length)) notes.push('Bagian Pembahasan belum ditemukan.');
  return notes;
}

export const helpers={norm,wc,isHeadingLike,headingLevel};
