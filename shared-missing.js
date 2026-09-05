(function(){
  async function loadSharedMissing(){
    if(typeof sbKey!=='function'||!sbKey())return null;
    try{
      return await sb('/missing_supplies?status=eq.OPEN&select=id,member_name,item_name,store_or_zone,notes,status,reported_at&order=reported_at.desc');
    }catch(e){return null;}
  }
  function relabel(){
    document.querySelectorAll('button,.card h2,.card h3').forEach(el=>{
      if(/report missing supplies/i.test(el.textContent||''))el.innerHTML=(el.tagName==='BUTTON'?'⚠️ ':'')+'Report an issue';
      if(/^missing supplies$/i.test((el.textContent||'').trim()))el.textContent='Reported issues';
    });
  }
  window.addMissing=async function(){
    const item=prompt('What happened? Describe the issue.');
    if(!item)return;
    const area=prompt('Where is the issue? (zone or area)','');
    const notes=prompt('Notes (optional)','');
    const local={person:currentPerson,text:item.trim(),area:(area||'').trim(),notes:(notes||'').trim(),time:timeNow(),status:'OPEN'};
    if(typeof sbKey==='function'&&sbKey()){
      try{
        await sb('/missing_supplies',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({member_name:currentPerson,item_name:item.trim(),store_or_zone:(area||'').trim()||null,notes:(notes||'').trim()||null,status:'OPEN'})});
      }catch(e){alert('Issue was not saved online: '+e.message);return;}
    }
    const l=getJSON(key('missing'),[]);l.unshift(local);setJSON(key('missing'),l);
    await renderMissing();
    alert('Issue reported online · '+currentPerson);
  };
  window.renderMissing=async function(){
    relabel();
    const online=await loadSharedMissing();
    if(online){
      $('missingList').innerHTML=online.length?online.map(x=>{const t=new Date(x.reported_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});return `<div class="review"><strong>${x.member_name} · ${t}</strong> · ${x.item_name}${x.store_or_zone?`<div class="muted">${x.store_or_zone}</div>`:''}${x.notes?`<div class="muted">${x.notes}</div>`:''}<span class="badge">${x.status}</span></div>`}).join(''):'No issues reported.';
      return;
    }
    const l=getJSON(key('missing'),[]);$('missingList').innerHTML=l.length?l.map(x=>`<div class="review"><strong>${x.person||'Walter'} · ${x.time}</strong> · ${x.text}${x.area?`<div class="muted">${x.area}</div>`:''}</div>`).join(''):'No issues reported.';
  };
  setTimeout(()=>{relabel();renderMissing()},300);
  setTimeout(relabel,1000);
})();
