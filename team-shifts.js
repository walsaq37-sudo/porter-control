(function(){
  const shifts={Walter:'10:00 – 18:00',Jhomar:'08:00 – 16:00',Pat:'08:00 – 17:00'};
  function updateShift(){
    const shift=shifts[currentPerson];
    const cards=[...document.querySelectorAll('.card.shift')];
    if(!cards.length)return;
    const card=cards[0];
    const time=card.querySelector('div>div:nth-child(2)');
    if(time&&shift)time.textContent=shift;
    else if(time&&!shift)time.textContent='Supervisory access';
  }
  const oldChange=window.changePerson;
  window.changePerson=function(n){oldChange(n);updateShift();};
  setTimeout(updateShift,100);
})();
