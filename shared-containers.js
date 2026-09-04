(function(){
  let sharedChecks={};
  async function loadContainerChecks(){
    if(!window.sbKey||!sbKey())return false;
    try{
      const start=dateKey+'T00:00:00.000Z',end=dateKey+'T23:59:59.999Z';
      const rows=await sb('/container_checks?member_name=eq.'+encodeURIComponent(currentPerson)+'&completed_at=gte.'+encodeURIComponent(start)+'&completed_at=lte.'+encodeURIComponent(end)+'&select=scheduled_time,completed_at&order=completed_at.asc');
      sharedChecks={};
      (rows||[]).forEach(r=>{const slot=(r.scheduled_time||'').slice(0,5);if(slot)sharedChecks[slot]=new Date(r.completed_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});});
      return true;
    }catch(e){return false;}
  }
  async function syncLocalChecks(){
    if(!window.sbKey||!sbKey())return;
    const local=getJSON(key('container-checks-'+currentPerson),{});
    for(const slot of ['10:00','14:00']){
      if(!local[slot]||sharedChecks[slot])continue;
      try{
        const actual=local[slot];
        const completed=new Date(dateKey+'T'+actual+':00').toISOString();
        await sb('/container_checks',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({member_name:currentPerson,scheduled_time:slot+':00',completed_at:completed})});
        sharedChecks[slot]=actual;
      }catch(e){}
    }
  }
  window.renderContainerChecks=async function(){
    const online=await loadContainerChecks();
    if(online){await syncLocalChecks();await loadContainerChecks();}
    const local=getJSON(key('container-checks-'+currentPerson),{});
    const s=online?Object.assign({},local,sharedChecks):local;
    $('containerChecks').innerHTML=['10:00','14:00'].map(slot=>`<div class="time-card"><div class="time-row"><strong>${slot}</strong><button class="round-btn" ${s[slot]?'disabled':''} onclick="completeContainerCheck('${slot}')">${s[slot]?'✓ Completed at '+s[slot]:'Complete check'}</button></div></div>`).join('');
  };
  window.completeContainerCheck=async function(slot){
    const k=key('container-checks-'+currentPerson),local=getJSON(k,{});
    if(sharedChecks[slot])return;
    if(local[slot]){await syncLocalChecks();await renderContainerChecks();return;}
    const actual=timeNow();
    if(window.sbKey&&sbKey()){
      try{
        await sb('/container_checks',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({member_name:currentPerson,scheduled_time:slot+':00',completed_at:new Date().toISOString()})});
      }catch(e){alert('Container check was not saved online: '+e.message);return;}
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
