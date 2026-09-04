(function(){
  const managers=['Humberto','Edita','Renato'];
  async function getRows(path){try{return await sb(path)}catch(e){return[]}}
  function supervisorCard(){return [...document.querySelectorAll('.card')].find(c=>c.textContent.includes('Supervisory view'));}
  async function renderSupervisorDashboard(){
    if(!managers.includes(currentPerson))return;
    const box=supervisorCard();if(!box)return;
    box.innerHTML='<h2>👁️ Supervisory view</h2><div class="muted">Loading shared team activity…</div>';
    if(!sbKey()){box.innerHTML='<h2>👁️ Supervisory view</h2><div class="muted">Shared database is not connected on this device.</div>';return;}
    const start=new Date();start.setHours(0,0,0,0);const iso=start.toISOString();
    const [rounds,missing,moves,checks]=await Promise.all([
      getRows('/daily_rounds?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,zone,inspection_type,completed_at&order=completed_at.desc'),
      getRows('/missing_supplies?status=eq.OPEN&select=member_name,item_name,store_or_zone,reported_at&order=reported_at.desc'),
      getRows('/stock_movements?created_at=gte.'+encodeURIComponent(iso)+'&select=member_name,product_name,movement_type,quantity,created_at&order=created_at.desc'),
      getRows('/container_checks?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,scheduled_time,completed_at&order=completed_at.desc')
    ]);
    const isInspection=x=>/kitchen|bathroom|inspection/i.test(x.inspection_type||'');
    const isRound=x=>!isInspection(x);
    const porters=['Walter','Jhomar','Pat'];
    const summaries=porters.map(n=>{const mine=rounds.filter(x=>x.member_name===n);const r=mine.filter(isRound).length;const insp=mine.filter(isInspection).length;const c=checks.filter(x=>x.member_name===n).length;return `<div class="review"><strong>👷 ${n}</strong><div class="muted">Rounds: ${r} · Inspections: ${insp} · Containers: ${c}</div></div>`}).join('');
    const miss=missing.length?missing.slice(0,6).map(x=>`<div class="review"><strong>⚠️ ${x.item_name}</strong><div class="muted">${x.member_name}${x.store_or_zone?' · '+x.store_or_zone:''}</div></div>`).join(''):'<div class="muted">No open missing supplies.</div>';
    const stock=moves.length?moves.slice(0,6).map(x=>`<div class="review"><strong>${x.movement_type==='TAKE'?'−':'+'} ${x.quantity} · ${x.product_name}</strong><div class="muted">${x.member_name} · ${new Date(x.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div></div>`).join(''):'<div class="muted">No stock movements today.</div>';
    box.innerHTML=`<h2>👁️ Supervisory view</h2><div class="muted">Shared activity for Walter, Jhomar and Pat.</div><h3>Team today</h3>${summaries}<h3>Open missing supplies</h3>${miss}<h3>Recent stock activity</h3>${stock}`;
  }
  const oldRenderAll=window.renderAll;window.renderAll=function(){oldRenderAll();setTimeout(renderSupervisorDashboard,50)};
  const oldChange=window.changePerson;window.changePerson=function(n){oldChange(n);setTimeout(renderSupervisorDashboard,100)};
  setTimeout(renderSupervisorDashboard,500);
})();
