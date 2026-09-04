(function(){
  const managers=['Humberto','Edita','Renato'];
  async function getRows(path){try{return await sb(path)}catch(e){return[]}}
  async function renderSupervisorDashboard(){
    if(!managers.includes(currentPerson))return;
    const box=$('zoneContent');
    box.innerHTML='<div class="card"><h2>👁️ Supervisory view</h2><div class="muted">Loading shared team activity…</div></div>';
    if(!sbKey()){box.innerHTML='<div class="card"><h2>👁️ Supervisory view</h2><div class="muted">Shared database is not connected on this device.</div></div>';return;}
    const start=new Date();start.setHours(0,0,0,0);const iso=start.toISOString();
    const [rounds,missing,moves,checks]=await Promise.all([
      getRows('/daily_rounds?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,zone,inspection_type,completed_at&order=completed_at.desc'),
      getRows('/missing_supplies?status=eq.OPEN&select=member_name,item_name,store_or_zone,reported_at&order=reported_at.desc'),
      getRows('/stock_movements?created_at=gte.'+encodeURIComponent(iso)+'&select=member_name,product_name,movement_type,quantity,created_at&order=created_at.desc'),
      getRows('/container_checks?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,scheduled_time,completed_at&order=completed_at.desc')
    ]);
    const porters=['Walter','Jhomar','Pat'];
    const summaries=porters.map(n=>{
      const r=rounds.filter(x=>x.member_name===n&&x.inspection_type==='Round completed').length;
      const insp=rounds.filter(x=>x.member_name===n&&x.inspection_type!=='Round completed').length;
      const c=checks.filter(x=>x.member_name===n).length;
      return `<div class="stock-row"><div class="stock-top"><strong>👷 ${n}</strong><span class="badge">Today</span></div><div class="muted">Rounds: ${r} · Inspections: ${insp} · Containers: ${c}</div></div>`;
    }).join('');
    const miss=missing.length?missing.slice(0,8).map(x=>`<div class="review"><strong>⚠️ ${x.item_name}</strong><div class="muted">${x.member_name}${x.store_or_zone?' · '+x.store_or_zone:''}</div></div>`).join(''):'<div class="muted">No open missing supplies.</div>';
    const stock=moves.length?moves.slice(0,8).map(x=>`<div class="review"><strong>${x.movement_type==='TAKE'?'−':'+'} ${x.quantity} · ${x.product_name}</strong><div class="muted">${x.member_name} · ${new Date(x.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div></div>`).join(''):'<div class="muted">No stock movements today.</div>';
    box.innerHTML=`<div class="card"><h2>👁️ Supervisory view</h2><div class="muted">Shared activity for Walter, Jhomar and Pat.</div></div><div class="card"><h2>👷 Team today</h2>${summaries}</div><div class="card"><h2>⚠️ Open missing supplies</h2>${miss}</div><div class="card"><h2>📦 Recent stock activity</h2>${stock}</div>`;
  }
  const oldRender=window.renderZone;
  window.renderZone=function(){oldRender();if(managers.includes(currentPerson))renderSupervisorDashboard();};
  const oldChange=window.changePerson;
  window.changePerson=function(n){oldChange(n);setTimeout(()=>{if(managers.includes(n))renderSupervisorDashboard()},0);};
  setTimeout(()=>{if(managers.includes(currentPerson))renderSupervisorDashboard()},300);
})();
