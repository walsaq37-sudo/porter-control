(function(){
 const supervisors=['Renato','Edita','Humberto'];
 function updateRoleUI(){
  const grid=document.querySelector('.quick-grid');if(!grid)return;
  const containerBtn=[...grid.querySelectorAll('button.quick')].find(b=>/Containers/i.test(b.textContent));
  if(containerBtn)containerBtn.style.display=supervisors.includes(currentPerson)?'none':'';
 }
 const oldChange=window.changePerson;
 window.changePerson=async function(n){await oldChange(n);setTimeout(updateRoleUI,0)};
 const oldRenderAll=window.renderAll;
 window.renderAll=function(){oldRenderAll();setTimeout(updateRoleUI,0)};
 document.addEventListener('DOMContentLoaded',updateRoleUI);
 setTimeout(updateRoleUI,300);
})();