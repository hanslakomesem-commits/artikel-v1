import {readDocx,buildArticleDocx,sourceFootnotes} from './docx-engine.js';
import {analyzeThesis,generatePlan,diagnostics,helpers} from './article-ai.js';

const $=s=>document.querySelector(s); let state={file:null,doc:null,analysis:null,plan:null,blob:null};
const app=$('#app');
app.innerHTML=`<div class="shell">
  <div class="top"><div class="brand"><h1>ZAIN.NET — Skripsi Jadi Artikel</h1><p>Scrib Article AI Lokal • ekstraktif • tanpa API token • data tetap di browser</p></div><div class="badge">AI LOKAL • OFFLINE-FIRST</div></div>
  <div class="grid">
   <aside class="panel"><h2>1. Upload & Pengaturan</h2><div class="pad">
    <label class="drop" id="drop"><strong>Upload Skripsi Utuh (.DOCX)</strong><small>Klik atau seret file Word ke sini</small><input id="file" type="file" accept=".docx"></label>
    <div class="field"><label>Mode Artikel</label><select id="mode"><option value="contoh">Mirip Contoh Anda (~3.300 kata)</option><option value="ringkas">Ringkas (~2.300 kata)</option><option value="lengkap">Lengkap (~5.000+ kata)</option></select></div>
    <div class="field"><label>Nama Penulis</label><input id="author" placeholder="Deteksi otomatis"></div>
    <div class="field"><label>Program Studi</label><input id="prodi" placeholder="Deteksi otomatis"></div>
    <div class="field"><label>Universitas</label><input id="univ" placeholder="Deteksi otomatis"></div>
    <div class="checks">
      <label><input type="checkbox" checked disabled> Abstrak</label><label><input type="checkbox" checked disabled> Pendahuluan</label>
      <label><input type="checkbox" checked disabled> Metode</label><label><input type="checkbox" checked disabled> Pembahasan</label>
      <label><input type="checkbox" checked disabled> Kesimpulan/Saran</label><label><input type="checkbox" checked disabled> Daftar Pustaka</label>
    </div>
    <div class="btnrow"><button class="btn primary" id="analyze" disabled>Analisis & Buat Draft</button><button class="btn ghost" id="regen" disabled>Buat Ulang</button></div>
    <div class="progress"><i id="bar"></i></div><div id="msg"></div>
   </div></aside>
   <main class="panel"><h2>2. Hasil Scrib Article AI Lokal</h2><div class="pad">
    <div class="stats"><div class="stat"><b id="sWords">0</b><span>Kata Skripsi</span></div><div class="stat"><b id="aWords">0</b><span>Kata Draft</span></div><div class="stat"><b id="conf">0%</b><span>Deteksi Struktur</span></div><div class="stat"><b id="refs">0</b><span>Referensi Dipilih</span></div></div>
    <div class="tabs"><button class="tab on" data-tab="review">Review Sumber</button><button class="tab" data-tab="preview">Preview Artikel</button><button class="tab" data-tab="info">Cara Kerja AI Lokal</button></div>
    <div id="review" class="tabpane"><div id="diag"></div><div id="sections" class="sections"><div class="notice">Upload skripsi untuk memulai.</div></div></div>
    <div id="preview" class="tabpane hidden"><div class="previewPaper" id="paper"></div></div>
    <div id="info" class="tabpane hidden"><div class="notice"><b>Scrib Article AI Lokal bukan AI generatif cloud.</b><br>Mesin membaca seluruh struktur DOCX, menghitung kata kunci global, memberi skor relevansi paragraf, mengenali BAB/subbagian, lalu <b>mengambil teks asli secara ekstraktif</b>. Karena output dibangun dari paragraf asli, kutipan/footnote Word yang menempel pada paragraf dapat ikut dipertahankan. Tidak ada API token dan isi skripsi tidak dikirim ke server.</div></div>
    <div class="btnrow"><button class="btn ok" id="download" disabled>Download Artikel .DOCX</button><button class="btn ghost" id="report" disabled>Download Laporan .TXT</button></div>
   </div></main>
  </div><div class="footer">ZAIN.NET • Scrib Article AI Lokal • semua proses berjalan di perangkat pengguna</div></div>`;

const fileInput=$('#file'),drop=$('#drop'),bar=$('#bar'),msg=$('#msg');
function setMsg(t,type=''){msg.innerHTML=t?`<div class="notice ${type}">${t}</div>`:'';}
function progress(n){bar.style.width=n+'%'}
function esc(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function useFile(f){if(!f||!f.name.toLowerCase().endsWith('.docx')){setMsg('Pilih file .DOCX.', 'warn');return;}state.file=f;$('#analyze').disabled=false;setMsg(`<b>${esc(f.name)}</b> siap dianalisis.`,'ok');}
fileInput.onchange=e=>useFile(e.target.files[0]);drop.onclick=e=>{if(e.target!==fileInput)fileInput.click()};
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor='#38bdf8'}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor=''}));drop.addEventListener('drop',e=>useFile(e.dataTransfer.files[0]));

async function run(){try{
  progress(10);setMsg('Membaca seluruh struktur DOCX…');state.doc=await readDocx(state.file);progress(35);
  state.analysis=analyzeThesis(state.doc);const a=state.analysis;$('#author').value=a.meta.author||'';$('#prodi').value=a.meta.prodi||'';$('#univ').value=a.meta.univ||'';progress(55);
  setMsg('Scrib Article AI Lokal menilai relevansi paragraf dan struktur BAB…');state.plan=generatePlan(state.doc,a,{mode:$('#mode').value});progress(80);render();
  state.blob=await buildArticleDocx(state.doc,a,state.plan,{author:$('#author').value,prodi:$('#prodi').value,univ:$('#univ').value});progress(100);setMsg('Draft artikel selesai. Review sumber lalu download DOCX.','ok');$('#download').disabled=false;$('#report').disabled=false;$('#regen').disabled=false;
}catch(e){console.error(e);setMsg('Gagal: '+esc(e.message||String(e)),'warn');progress(0)}}
$('#analyze').onclick=run;$('#regen').onclick=async()=>{if(!state.doc)return;state.plan=generatePlan(state.doc,state.analysis,{mode:$('#mode').value});render();state.blob=await buildArticleDocx(state.doc,state.analysis,state.plan,{author:$('#author').value,prodi:$('#prodi').value,univ:$('#univ').value});setMsg('Draft dibuat ulang dengan mode baru.','ok')};
function render(){const a=state.analysis,p=state.plan,d=state.doc;$('#sWords').textContent=a.wordCount.toLocaleString('id-ID');$('#aWords').textContent=p.totalWords.toLocaleString('id-ID');$('#conf').textContent=Math.round(a.confidence*100)+'%';const b=p.sections.find(x=>x.id==='biblio');$('#refs').textContent=b?b.items.length:0;
 const notes=diagnostics(d,a,p);$('#diag').innerHTML=notes.map(x=>`<div class="notice warn">${esc(x)}</div>`).join('')||'<div class="notice ok">Struktur utama terdeteksi dengan baik.</div>';
 $('#sections').innerHTML=p.sections.map(s=>`<div class="sec"><div class="secHead"><b>${esc(s.title)}</b><span>${s.items.reduce((z,x)=>z+helpers.wc(d.items[x.index]?.text||''),0)} kata • ${s.items.length} blok</span></div><div class="paras">${s.items.map(x=>`<div class="para ${x.role==='subheading'?'sub':''}">${esc(d.items[x.index]?.text||'')}<span class="trace">Sumber blok #${x.index+1} • ${esc(x.source)}</span></div>`).join('')}</div></div>`).join('');
 const m={...a.meta,author:$('#author').value||a.meta.author,prodi:$('#prodi').value||a.meta.prodi,univ:$('#univ').value||a.meta.univ}; let html=`<h3>${esc((m.title||'ARTIKEL ILMIAH').toUpperCase())}</h3><div class="identity"><b>${esc(m.author||'Nama Penulis')}</b></div><div class="identity"><i>${esc(m.prodi||'')}</i></div><div class="identity"><i>${esc(m.univ||'')}</i></div>`;
 for(const s of p.sections){html+=`<h4 style="${s.id==='biblio'?'text-align:center':''}">${esc(s.title)}</h4>`;for(const x of s.items){const t=d.items[x.index]?.text||'';html+=`<p class="${x.role==='subheading'?'sub':''}" style="${x.role==='bibliography'?'text-indent:-1.27cm;margin-left:1.27cm;':''}">${esc(t)}</p>`;}}$('#paper').innerHTML=html;}

for(const t of document.querySelectorAll('.tab'))t.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.tabpane').forEach(x=>x.classList.add('hidden'));t.classList.add('on');$('#'+t.dataset.tab).classList.remove('hidden')};
function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
$('#download').onclick=async()=>{if(!state.blob)return;const author=($('#author').value||state.analysis.meta.author||'MAHASISWA').replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_|_$/g,'');saveBlob(state.blob,`Artikel_${author}_ZAINNET_AI_LOKAL.docx`)};
$('#report').onclick=()=>{const a=state.analysis,p=state.plan;const fns=sourceFootnotes(state.doc,p);let txt=`ZAIN.NET — LAPORAN SCRIB ARTICLE AI LOKAL\n\nFile: ${state.file.name}\nJudul: ${a.meta.title}\nPenulis: ${$('#author').value}\nKata skripsi: ${a.wordCount}\nKata draft: ${p.totalWords}\nConfidence struktur: ${Math.round(a.confidence*100)}%\nFootnote yang ikut terpakai: ${fns.length}\n\nBAGIAN TERPILIH:\n`;for(const s of p.sections)txt+=`- ${s.title}: ${s.items.length} blok\n`;txt+='\nCatatan: sistem bersifat ekstraktif; teks utama diambil dari naskah sumber, bukan ditulis ulang AI cloud.\n';saveBlob(new Blob([txt],{type:'text/plain;charset=utf-8'}),'Laporan_Artikel_ZAINNET.txt')};
