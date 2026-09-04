(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function messageBox(){return document.querySelector('#messagesScreen .screen-inner')}
  async function loadMessages(){
    const list=document.getElementById('sharedMessagesList');if(!list)return;
    if(!sbKey()){list.innerHTML='<div class="muted">Shared database is not connected on this device.</div>';return;}
    list.innerHTML='<div class="muted">Loading messages…</div>';
    try{
      const rows=await sb('/messages?select=*&order=created_at.desc&limit=50');
      if(!rows||!rows.length){list.innerHTML='<div class="muted">No team messages yet.</div>';return;}
      list.innerHTML=rows.slice().reverse().map(m=>{
        const sender=m.member_name||m.sender_name||m.sender||m.name||'Team';
        const text=m.message||m.message_text||m.text||m.body||'';
        const when=m.created_at?new Date(m.created_at).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
        return `<div class="review"><strong>${esc(sender)}</strong><div>${esc(text)}</div><div class="muted">${esc(when)}</div></div>`;
      }).join('');
    }catch(e){list.innerHTML='<div class="muted">Could not load team messages: '+esc(e.message)+'</div>';}
  }
  async function sendMessage(){
    const input=document.getElementById('sharedMessageInput'),btn=document.getElementById('sharedMessageSend');
    const text=(input.value||'').trim();if(!text)return;
    btn.disabled=true;
    const candidates=[
      {member_name:currentPerson,message:text},
      {sender_name:currentPerson,message:text},
      {sender:currentPerson,message:text},
      {member_name:currentPerson,message_text:text},
      {sender_name:currentPerson,message_text:text}
    ];
    let err=null;
    for(const body of candidates){
      try{await sb('/messages',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(body)});err=null;break}catch(e){err=e}
    }
    btn.disabled=false;
    if(err){alert('Message was not saved online: '+err.message);return;}
    input.value='';await loadMessages();
  }
  function build(){
    const box=messageBox();if(!box||document.getElementById('sharedMessagesList'))return;
    const old=[...box.querySelectorAll('.card')].find(c=>c.textContent.includes('Shared messaging'));
    if(old)old.remove();
    box.insertAdjacentHTML('beforeend',`<div class="card"><strong>Shared team chat</strong><div id="sharedMessagesList" style="margin-top:10px"></div></div><div class="card"><textarea id="sharedMessageInput" rows="3" placeholder="Write a message to the team…" style="width:100%;padding:12px;border-radius:12px;background:#071b33;color:#fff;border:1px solid #1d4b78;font:inherit;resize:vertical"></textarea><button id="sharedMessageSend" class="save" style="margin-top:10px">Send message</button></div>`);
    document.getElementById('sharedMessageSend').onclick=sendMessage;
  }
  const oldOpen=window.openMessages;
  window.openMessages=function(){if(oldOpen)oldOpen();build();loadMessages();};
  setInterval(()=>{if(!$('messagesScreen').classList.contains('hidden'))loadMessages()},10000);
})();
