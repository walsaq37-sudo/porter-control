(function(){
  const originalSaveReview = window.saveReview;
  window.saveReview = async function(zone,type,prefix){
    const state = getJSON(key(prefix),{});
    const items = type==='Kitchen' ? kitchenItems : bathroomItems;
    const completedItems = items.filter((_,i)=>state[i]);
    const missingItems = items.filter((_,i)=>!state[i]);
    const now = timeNow();
    const history = getJSON(key('history'),[]);
    history.unshift({person:currentPerson,zone,type,time:now,checked:completedItems.length,total:items.length});
    setJSON(key('history'),history);

    if(sbKey()){
      try{
        await sb('/daily_rounds',{
          method:'POST',
          headers:{'Prefer':'return=minimal'},
          body:JSON.stringify({
            member_name:currentPerson,
            zone:zone,
            inspection_type:type+' inspection',
            status:'COMPLETED',
            notes:JSON.stringify({
              checked:completedItems.length,
              total:items.length,
              completed_items:completedItems,
              unchecked_items:missingItems
            })
          })
        });
        alert('Inspection saved online: '+currentPerson+' · '+zone+' · '+type+' ('+completedItems.length+'/'+items.length+')');
        return;
      }catch(err){
        alert('Inspection saved on this device, but online sync failed: '+err.message);
        return;
      }
    }

    if(typeof originalSaveReview==='function'){
      alert('Inspection saved on this device. Shared database is not connected on this device.');
    }
  };
})();
