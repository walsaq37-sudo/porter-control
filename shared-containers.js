(function(){
  let sharedChecks={};
  const hasSupabase=()=>typeof sbKey==='function'&&!!sbKey();
  async function loadContainerChecks(){
    if(!hasSupabase())return false;
    sharedChecks={};
    const start=dateKey+'T00:00:00.000Z',end=dateKey+'T23:59:59.999Z';
    let ok=false;
    try{
      const rows=await sb('/container_checks?member_name=eq.'+encodeURIComponent(currentPerson)+'&completed_at=gte.'+encodeURIComponent(start)+'&completed_at=lte.'+encodeURIComponent(end)+'&select=scheduled_time,completed_at&order=completed_at.asc');
      (rows||[]).forEach(r=>{const slot=(r.scheduled_time||'').slice(0,5);if(slot)sharedChecks[slot]=new Date(r.completed_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});});
      ok=true;
    }catch(e){}
    try{
      const rows=await sb('/daily_rounds?member_name=eq.'+encodeURIComponent(currentPerson)+'&completed_at=gte.'+encodeURIComponent(start)+'&completed_at=lte.'+encodeURIComponent(end)+'&inspection_type=ilike.Container%25&select=inspection_type,completed_at&order=completed_at.asc');
      (rows||[]).forEach(r=>{const m=(r.inspection_type||'').match(/(10:00|14:00)/);if(m&&!sharedChecks[m[1]])sharedChecks[m[1]]=new Date(r.completed_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});});
      ok=true;
    }catch(e){}
    return ok;
  }
  async function saveOnline(slot,completedAt){
    try{
      await sb('/daily_rounds',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({member_name:currentPerson,zone:'Reusable Containers',inspection_type:'Container check '+slot,status:'COMPLETED',notes:'Scheduled container check '+slot,completed_at:completedAt})});
      return true;
    }catch(e){
      alert('Container check was not saved online: '+e.message);
      return false;
    }
  }
  async function syncLocalChecks(){
    if(!hasSupabase())return;
    const local=getJSON(key('container-checks-'+currentPerson),{});
    for(const slot of ['10:00','14:00']){
      if(!local[slot]||sharedChecks[slot])continue;
      const actual=local[slot];
      const completed=new Date(dateKey+'T'+actual+':00').toISOString();
      if(await saveOnline(slot,completed))sharedChecks[slot]=actual;
    }
  }
  window.renderContainerChecks=async function(){
    const online=await loadContainerChecks();
    if(online){await syncLocalChecks();await loadContainerChecks();}
    const local=getJSON(key('container-checks-'+currentPerson),{});
    const s=Object.assign({},local,sharedChecks);
    $('containerChecks').innerHTML=['10:00','14:00'].map(slot=>`<div class="time-card"><div class="time-row"><strong>${slot}</strong><button class="round-btn" ${s[slot]?'disabled':''} onclick="completeContainerCheck('${slot}')">${s[slot]?'✓ Completed at '+s[slot]:'Complete check'}</button></div></div>`).join('');
  };
  window.completeContainerCheck=async function(slot){
    const k=key('container-checks-'+currentPerson),local=getJSON(k,{});
    if(sharedChecks[slot])return;
    if(local[slot]){await syncLocalChecks();await renderContainerChecks();return;}
    const actual=timeNow(),completedAt=new Date().toISOString();
    if(hasSupabase()){
      const saved=await saveOnline(slot,completedAt);if(!saved)return;
    }
    local[slot]=actual;setJSON(k,local);
    const h=getJSON(key('history'),[]);h.unshift({person:currentPerson,zone:'Reusable Containers',type:slot+' scheduled check',time:actual});setJSON(key('history'),h);
    await renderContainerChecks();
    alert('Container check saved online · '+currentPerson+' · '+slot);
  };
  const oldOpen=window.openContainers;
  window.openContainers=function(){if(oldOpen)oldOpen();renderContainerChecks();};
  setTimeout(()=>renderContainerChecks(),350);
})();
