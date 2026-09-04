(function(){
  async function loadSharedMissing(){
    if(!window.sbKey||!sbKey())return null;
    try{
      return await sb('/missing_supplies?status=eq.OPEN&select=id,member_name,item_name,store_or_zone,notes,status,reported_at&order=reported_at.desc');
    }catch(e){return null;}
  }
  window.addMissing=async function(){
    const item=prompt('What supplies are missing?');
    if(!item)return;
    const area=prompt('Where is it missing? (zone or store)','');
    const notes=prompt('Notes (optional)','');
    const local={person:currentPerson,text:item.trim(),area:(area||'').trim(),notes:(notes||'').trim(),time:timeNow(),status:'OPEN'};
    if(window.sbKey&&sbKey()){
      try{
        await sb('/missing_supplies',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({member_name:currentPerson,item_name:item.trim(),store_or_zone:(area||'').trim()||null,notes:(notes||'').trim()||null,status:'OPEN'})});
      }catch(e){alert('Missing supply was not saved online: '+e.message);return;}
    }
    const l=getJSON(key('missing'),[]);l.unshift(local);setJSON(key('missing'),l);
    await renderMissing();
    alert('Missing supply saved online · '+currentPerson);
  };
  window.renderMissing=async function(){
    const online=await loadSharedMissing();
    if(online){
      $('missingList').innerHTML=online.length?online.map(x=>{const t=new Date(x.reported_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});return `<div class="review"><strong>${x.member_name} · ${t}</strong> · ${x.item_name}${x.store_or_zone?`<div class="muted">${x.store_or_zone}</div>`:''}${x.notes?`<div class="muted">${x.notes}</div>`:''}<span class="badge">${x.status}</span></div>`}).join(''):'No missing supplies reported.';
      return;
    }
    const l=getJSON(key('missing'),[]);$('missingList').innerHTML=l.length?l.map(x=>`<div class="review"><strong>${x.person||'Walter'} · ${x.time}</strong> · ${x.text}${x.area?`<div class="muted">${x.area}</div>`:''}</div>`).join(''):'No missing supplies reported.';
  };
  setTimeout(()=>renderMissing(),300);
})();
