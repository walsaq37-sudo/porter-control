(function(){
  const shifts={Walter:'10:00 – 18:00',Jhomar:'08:00 – 16:00',Pat:'08:00 – 17:00'};
  const access={Humberto:'Supervisor access',Edita:'Assistant Manager access',Renato:'Manager access'};
  function updateShift(){
    const card=document.querySelector('.card.shift');
    if(!card)return;
    const shift=shifts[currentPerson]||access[currentPerson]||'Supervisory access';
    const strong=card.querySelector('strong');
    if(!strong)return;
    strong.textContent=shifts[currentPerson]?'Your shift':'Your access';
    const content=strong.parentElement;
    const time=[...content.children].find(el=>el.tagName==='DIV'&&!el.classList.contains('muted'));
    if(time)time.textContent=shift;
    const muted=content.querySelector('.muted');
    if(muted)muted.textContent=shifts[currentPerson]?'Flexible rounds throughout your shift.':'View team activity and operational reports.';
  }
  const oldChange=window.changePerson;
  window.changePerson=function(n){oldChange(n);setTimeout(updateShift,0);};
  document.addEventListener('DOMContentLoaded',updateShift);
  setTimeout(updateShift,100);
})();