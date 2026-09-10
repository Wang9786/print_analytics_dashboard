const departments=['研發部','製造部','業務部','管理部','品保部','資訊部'];
const sites=['北區營運中心','中區製造中心','南區服務中心'];
const users={研發部:['王小明','王大明','李小華'],製造部:['陳小美','張小強','林小芳'],業務部:['黃小玲','劉小偉','蔡小英'],管理部:['楊小文','吳小安','周小平'],品保部:['鄭小君','許小樂','謝小宇'],資訊部:['郭小光','曾小青','賴小新']};
const docs=['季度分析.pdf','製程檢查表.xlsx','客戶提案.pptx','會議紀錄.docx','出貨明細.pdf','教育訓練講義.pdf'];
const seeded=n=>{const x=Math.sin(n*9301+49297)*233280;return x-Math.floor(x)};
const pad=n=>String(n).padStart(2,'0');
const records=[];
['2026-07','2026-08','2026-09'].forEach((month,mi)=>{
  for(let i=0;i<180;i++){
    const day=1+Math.floor(seeded(i+mi*500)*28),dept=departments[Math.floor(seeded(i+mi*700+3)*departments.length)];
    const color=seeded(i+mi*900+7)>.76,pages=1+Math.floor(seeded(i+mi*1100+9)*(color?48:76));
    records.push({month,date:`${month}-${pad(day)}`,time:`${pad(8+Math.floor(seeded(i+19)*10))}:${pad(Math.floor(seeded(i+29)*60))}`,site:sites[Math.floor(seeded(i+mi*1300+11)*3)],dept,user:users[dept][Math.floor(seeded(i+31)*3)],doc:docs[Math.floor(seeded(i+41)*docs.length)],mode:color?'彩色':'黑白',pages,cost:+(pages*(color?3:0.5)).toFixed(1),hour:8+Math.floor(seeded(i+19)*10)});
  }
});

const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
let filtered=[];

function init(){
  ['2026-09','2026-08','2026-07'].forEach(m=>$('monthFilter').add(new Option(m.replace('-',' 年 ')+' 月',m)));
  departments.forEach(d=>$('deptFilter').add(new Option(d,d)));
  ['siteFilter','monthFilter','deptFilter'].forEach(id=>$(id).addEventListener('change',render));
  $('resetBtn').addEventListener('click',()=>{$('siteFilter').value='ALL';$('monthFilter').value='2026-09';$('deptFilter').value='ALL';render()});
  $('exportBtn').addEventListener('click',exportCsv);
  $('projectBtn').addEventListener('click',()=>$('project').scrollIntoView({behavior:'smooth'}));
  window.addEventListener('resize',()=>drawTrend(filtered));
  render();
}

function render(){
  const site=$('siteFilter').value,month=$('monthFilter').value,dept=$('deptFilter').value;
  filtered=records.filter(r=>r.month===month&&(site==='ALL'||r.site===site)&&(dept==='ALL'||r.dept===dept));
  const pages=filtered.reduce((s,r)=>s+r.pages,0),jobs=filtered.length,color=filtered.filter(r=>r.mode==='彩色').reduce((s,r)=>s+r.pages,0),cost=filtered.reduce((s,r)=>s+r.cost,0),gray=pages-color,rate=pages?Math.round(color/pages*100):0;
  $('totalPages').textContent=fmt(pages);$('totalJobs').textContent=fmt(jobs);$('colorRate').textContent=rate+'%';$('totalCost').textContent='$'+fmt(Math.round(cost));
  $('donutTotal').textContent=fmt(pages);$('grayPages').textContent=fmt(gray)+' 頁';$('colorPages').textContent=fmt(color)+' 頁';
  $('colorDonut').style.background=`conic-gradient(var(--orange) 0 ${rate}%,var(--cyan) ${rate}% 100%)`;
  $('pageDelta').textContent=`↑ ${Math.max(2,Math.round(seeded(pages)*14))}% 較上期`;$('jobDelta').textContent=`↑ ${Math.max(1,Math.round(seeded(jobs)*9))}% 較上期`;
  renderRanking('deptRanking','dept');renderRanking('userRanking','user');renderHeatmap();renderTable();drawTrend(filtered);$('updatedAt').textContent='剛剛';
}

function renderRanking(target,key){
  const map={};filtered.forEach(r=>map[r[key]]=(map[r[key]]||0)+r.pages);
  const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5),max=rows[0]?.[1]||1;
  $(target).innerHTML=rows.map(([name,val],i)=>`<div class="rank-row"><span class="rank-no">0${i+1}</span><span class="rank-name">${name}</span><span class="rank-bar"><i style="width:${val/max*100}%"></i></span><span class="rank-value">${fmt(val)} 頁</span></div>`).join('')||'<p class="muted">沒有符合條件的資料</p>';
}

function renderHeatmap(){
  const days=['週一','週二','週三','週四','週五'],hours=['08–09','10–11','12–13','14–15','16–17','18+'];
  let html='<span></span>'+hours.map(h=>`<span class="heat-label">${h}</span>`).join('')+'<span class="heat-label">日均</span><span class="heat-label">趨勢</span>';
  days.forEach((d,di)=>{html+=`<span class="heat-label heat-day">${d}</span>`;let sum=0;hours.forEach((h,hi)=>{const value=Math.round((seeded(di*11+hi+filtered.length)*.75+.12)*100);sum+=value;const a=.12+value/135;html+=`<span class="heat-cell" data-tip="${d} ${h}｜${value} 次" style="background:rgba(49,214,196,${a})"></span>`});html+=`<span class="heat-label">${Math.round(sum/6)}</span><span class="heat-label" style="color:${di%2?'var(--orange)':'var(--cyan)'}">${di%2?'↘':'↗'}</span>`});$('heatmap').innerHTML=html;
}

function renderTable(){
  const rows=[...filtered].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,8);
  $('recordCount').textContent=filtered.length+' 筆資料';
  $('recordRows').innerHTML=rows.map(r=>`<tr><td>${r.date} ${r.time}</td><td>${r.site}</td><td>${r.dept}</td><td>${r.user}</td><td>${r.doc}</td><td><span class="mode ${r.mode==='彩色'?'color':'gray'}">${r.mode}</span></td><td class="num">${r.pages}</td><td class="num">$${r.cost.toFixed(1)}</td></tr>`).join('');
}

function drawTrend(data){
  const c=$('trendChart'),box=c.parentElement.getBoundingClientRect(),dpr=window.devicePixelRatio||1;c.width=box.width*dpr;c.height=box.height*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);const w=box.width,h=box.height,p={l:38,r:12,t:12,b:27};
  const days=[3,6,9,12,15,18,21,24,27],series=mode=>days.map((day,idx)=>data.filter(r=>r.mode===mode&&+r.date.slice(-2)>=day&&+r.date.slice(-2)<day+3).reduce((s,r)=>s+r.pages,0));const gray=series('黑白'),color=series('彩色'),max=Math.max(...gray,...color,100)*1.15;
  x.font='11px Segoe UI';x.strokeStyle='#1c303d';x.fillStyle='#687f8e';x.lineWidth=1;for(let i=0;i<5;i++){const y=p.t+(h-p.t-p.b)*i/4;x.beginPath();x.moveTo(p.l,y);x.lineTo(w-p.r,y);x.stroke();x.fillText(fmt(Math.round(max*(1-i/4))),2,y+4)}
  const draw=(arr,color,fill)=>{x.beginPath();arr.forEach((v,i)=>{const px=p.l+(w-p.l-p.r)*i/(arr.length-1),py=p.t+(h-p.t-p.b)*(1-v/max);i?x.lineTo(px,py):x.moveTo(px,py)});if(fill){x.lineTo(w-p.r,h-p.b);x.lineTo(p.l,h-p.b);x.closePath();const g=x.createLinearGradient(0,p.t,0,h);g.addColorStop(0,fill);g.addColorStop(1,'transparent');x.fillStyle=g;x.fill();}x.beginPath();arr.forEach((v,i)=>{const px=p.l+(w-p.l-p.r)*i/(arr.length-1),py=p.t+(h-p.t-p.b)*(1-v/max);i?x.lineTo(px,py):x.moveTo(px,py)});x.strokeStyle=color;x.lineWidth=2;x.stroke()};
  draw(gray,'#31d6c4','#31d6c426');draw(color,'#ff9f43','#ff9f4310');x.fillStyle='#687f8e';days.forEach((day,i)=>x.fillText(`${day}日`,p.l+(w-p.l-p.r)*i/(days.length-1)-8,h-7));
}

function exportCsv(){
  const head=['日期','時間','據點','部門','使用者','文件','模式','頁數','預估成本'];const lines=[head,...filtered.map(r=>[r.date,r.time,r.site,r.dept,r.user,r.doc,r.mode,r.pages,r.cost])].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(','));
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`printscope-${$('monthFilter').value}.csv`;a.click();URL.revokeObjectURL(a.href);showToast('CSV 已匯出（展示資料）');
}
function showToast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2400)}
init();
