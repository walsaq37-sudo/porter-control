(function(){
  function apply(){
    if(typeof people==='undefined'||!people.Jhomar)return;
    people.Jhomar.zones=[
      {name:'Bet',kitchen:true,bathroom:false},
      {name:'Middle',kitchen:true,bathroom:true},
      {name:'Malcolm',kitchen:true,bathroom:true}
    ];
    if(typeof currentPerson!=='undefined'&&currentPerson==='Jhomar'){
      if(typeof renderTabs==='function')renderTabs();
      if(typeof renderZone==='function')renderZone();
      if(typeof renderRounds==='function')renderRounds();
    }
  }
  apply();
  setTimeout(apply,100);
})();