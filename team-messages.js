(function(){
  let knownLatest=null,primed=false,knownIssue=null,issuesPrimed=false,audioCtx=null;
  const supervisors=['Renato','Edita','Humberto'];
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function messageBox(){return document.querySelector('#messagesScreen .screen-inner')}
  function unlockAudio(){
    try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audioCtx)audioCtx=new A();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}
  }
  ['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,unlockAudio,{once:true,passive:true}));
  function tone(freq,duration=.18,delay=0,gain=.08){
    try{unlockAudio();if(!audioCtx||audioCtx.state!=='running')return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.connect(g);g.connect(audioCtx.destination);o.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.start(t);o.stop(t+duration)}catch(e){}
  }
  function beep(kind='message'){
    if(kind==='issue'){tone(920,.16,0,.10);tone(720,.18,.22,.10)}
    else tone(660,.22,0,.08);
  }
  async function latestMessages(checkOnly=false){
    if(!sbKey())return;
    try{
      const rows=await sb('/messages?select=*&order=created_at.desc&limit=50');
      if(!rows||!rows.length){primed=true;return rows||[];}
      const latest=rows[0],latestId=String(latest.id||latest.created_at||'');
      if(primed&&knownLatest&&latestId&&latestId!==knownLatest){const sender=latest.member_name||latest.sender_name||latest.sender||latest.name||'Team';if(sender!==currentPerson)beep('message');}
      knownLatest=latestId;primed=true;return rows;
    }catch(e){if(!checkOnly)throw e;return null}
  }
  async function checkIssues(){
    if(!sbKey()||!supervisors.includes(currentPerson))return;
    try{
      const rows=await sb('/missing_supplies?status=eq.OPEN&select=id,member_name,item_name,reported_at&order=reported_at.desc&limit=1');
      if(!rows||!rows.length){issuesPrimed=true;return;}
      const latest=rows[0],id=String(latest.id||latest.reported_at||'');
      if(issuesPrimed&&knownIssue&&id&&id!==knownIssue){const sender=latest.member_name||'Team';if(sender!==currentPerson)beep('issue');}
      knownIssue=id;issuesPrimed=true;
    }catch(e){}
  }
  async function loadMessages(){
    const list=document.getElementById('sharedMessagesList');if(!list)return;
    if(!sbKey()){list.innerHTML='<div class="muted">Shared database is not connected on this device.</div>';return;}
    if(!primed)list.innerHTML='<div class="muted">Loading messages…</div>';
    try{
      const rows=await latestMessages(false);
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
    for(const body of candidates){try{await sb('/messages',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(body)});err=null;break}catch(e){err=e}}
    btn.disabled=false;
    if(err){alert('Message was not saved online: '+err.message);return;}
    input.value='';await loadMessages();
  }
  function build(){
    const box=messageBox();if(!box||document.getElementById('sharedMessagesList'))return;
    const old=[...box.querySelectorAll('.card')].find(c=>c.textContent.includes('Shared messaging'));if(old)old.remove();
    box.insertAdjacentHTML('beforeend',`<div class="card"><strong>Shared team chat</strong><div id="sharedMessagesList" style="margin-top:10px"></div></div><div class="card"><textarea id="sharedMessageInput" rows="3" placeholder="Write a message to the team…" style="width:100%;padding:12px;border-radius:12px;background:#071b33;color:#fff;border:1px solid #1d4b78;font:inherit;resize:vertical"></textarea><button id="sharedMessageSend" class="save" style="margin-top:10px">Send message</button></div>`);
    document.getElementById('sharedMessageSend').onclick=sendMessage;
  }
  const oldOpen=window.openMessages;window.openMessages=function(){if(oldOpen)oldOpen();build();loadMessages();};
  window.addEventListener('porter:issue-reported',()=>beep('issue'));
  setTimeout(()=>{latestMessages(true);checkIssues()},1500);
  setInterval(()=>{
    latestMessages(true);
    checkIssues();
    const screen=document.getElementById('messagesScreen');if(screen&&!screen.classList.contains('hidden'))loadMessages();
  },10000);
})();