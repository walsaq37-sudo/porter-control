(function(){
  const supervisoryNames=new Set(['Renato','Edita','Humberto']);
  const oldOpen=window.openAllHistory;

  function fmtDateTime(value){
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return {date:'',time:''};
    return {
      date:d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      time:d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
    };
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  async function fetchRows(path){
    try{return await sb(path)}catch(e){return []}
  }

  async function loadSharedHistory(){
    if(!(typeof sbKey==='function'&&sbKey()))return null;
    const isSupervisor=supervisoryNames.has(currentPerson);
    const memberFilter=isSupervisor?'':'&member_name=eq.'+encodeURIComponent(currentPerson);

    const [rounds,moves,issues]=await Promise.all([
      fetchRows('/daily_rounds?select=member_name,zone,inspection_type,status,notes,completed_at&order=completed_at.desc&limit=250'+memberFilter),
      fetchRows('/stock_movements?select=member_name,store_id,product_name,movement_type,quantity,created_at&order=created_at.desc&limit=250'+memberFilter),
      fetchRows('/missing_supplies?select=member_name,item_name,store_or_zone,notes,status,reported_at,resolved_at&order=reported_at.desc&limit=250'+memberFilter)
    ]);

    const rows=[];
    (rounds||[]).forEach(r=>rows.push({
      at:r.completed_at,
      member:r.member_name,
      title:r.inspection_type||'Activity',
      detail:[r.zone,r.status].filter(Boolean).join(' · '),
      notes:r.notes||''
    }));
    (moves||[]).forEach(r=>rows.push({
      at:r.created_at,
      member:r.member_name,
      title:'Stock '+(r.movement_type||'').toUpperCase(),
      detail:['Store '+r.store_id,r.product_name,'Qty '+r.quantity].filter(Boolean).join(' · '),
      notes:''
    }));
    (issues||[]).forEach(r=>rows.push({
      at:r.reported_at,
      member:r.member_name,
      title:'Reported issue',
      detail:[r.item_name,r.store_or_zone,r.status].filter(Boolean).join(' · '),
      notes:r.notes||''
    }));

    rows.sort((a,b)=>new Date(b.at)-new Date(a.at));
    return rows;
  }

  window.openAllHistory=async function(){
    $('allHistoryScreen').classList.remove('hidden');
    $('allHistory').innerHTML='<div class="card muted">Loading shared history…</div>';

    const rows=await loadSharedHistory();
    if(rows===null){
      if(typeof oldOpen==='function')return oldOpen();
      $('allHistory').innerHTML='<div class="card muted">Shared database is not connected on this device.</div>';
      return;
    }

    if(!rows.length){
      $('allHistory').innerHTML='<div class="card muted">No shared history yet.</div>';
      return;
    }

    $('allHistory').innerHTML=rows.map(r=>{
      const dt=fmtDateTime(r.at);
      return `<div class="time-card"><strong>${esc(dt.date)} · ${esc(dt.time)}</strong><div>${esc(r.member||'')} · ${esc(r.title)}</div><div class="muted">${esc(r.detail)}</div>${r.notes?`<div class="muted" style="margin-top:6px">${esc(r.notes)}</div>`:''}</div>`;
    }).join('');
  };
})();
