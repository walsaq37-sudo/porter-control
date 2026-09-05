(function(){
  const managers=['Humberto','Edita','Renato'];
  let data={rounds:[],missing:[],moves:[],checks:[]};
  let dashboardBox=null;
  async function getRows(path){try{return await sb(path)}catch(e){return[]}}
  function supervisorCard(){if(dashboardBox&&document.body.contains(dashboardBox))return dashboardBox;dashboardBox=[...document.querySelectorAll('.card')].find(c=>/Supervisory view|Vista de supervisión/i.test(c.textContent));return dashboardBox;}
  const isContainer=x=>/container/i.test(x.inspection_type||'');
  const isInspection=x=>!isContainer(x)&&/kitchen|bathroom|inspection/i.test(x.inspection_type||'');
  const isRound=x=>!isContainer(x)&&!isInspection(x);
  function time(v){return new Date(v).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
  function porterDetail(n){
    const box=supervisorCard();if(!box)return;
    const mine=data.rounds.filter(x=>x.member_name===n),rounds=mine.filter(isRound),insp=mine.filter(isInspection),checks=data.checks.filter(x=>x.member_name===n),issues=data.missing.filter(x=>x.member_name===n),moves=data.moves.filter(x=>x.member_name===n);
    const section=(title,rows,render,empty)=>`<h3>${title}</h3>${rows.length?rows.map(render).join(''):`<div class="muted">${empty}</div>`}`;
    box.innerHTML=`<h2>👷 ${n}</h2><button type="button" class="back" id="porterBack">← Back to team</button><div class="muted" style="margin-top:10px">Today's shared activity</div>`+
      section('Rounds',rounds,x=>`<div class="review"><strong>🔄 ${x.zone}</strong><div class="muted">${time(x.completed_at)}</div></div>`,'No rounds completed today.')+
      section('Inspections',insp,x=>`<div class="review"><strong>✅ ${x.zone}</strong><div class="muted">${x.inspection_type||'Inspection'} · ${time(x.completed_at)}</div></div>`,'No inspections completed today.')+
      section('Containers',checks,x=>`<div class="review"><strong>♻️ ${x.scheduled_time||'Container check'}</strong><div class="muted">Completed ${time(x.completed_at)}</div></div>`,'No container checks completed today.')+
      section('Reported issues',issues,x=>`<div class="review"><strong>⚠️ ${x.item_name}</strong><div class="muted">${x.store_or_zone||''}</div></div>`,'No open issues reported.')+
      section('Stock activity',moves,x=>`<div class="review"><strong>${x.movement_type==='TAKE'?'−':'+'} ${x.quantity} · ${x.product_name}</strong><div class="muted">${time(x.created_at)}</div></div>`,'No stock movements today.');
    const back=box.querySelector('#porterBack');if(back)back.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();renderSupervisorDashboard(false)});
  }
  async function renderSupervisorDashboard(refresh=true){
    if(!managers.includes(currentPerson))return;
    const box=supervisorCard();if(!box)return;
    if(refresh){box.innerHTML='<h2>👁️ Supervisory view</h2><div class="muted">Loading shared team activity…</div>';if(!sbKey()){box.innerHTML='<h2>👁️ Supervisory view</h2><div class="muted">Shared database is not connected on this device.</div>';return;}const start=new Date();start.setHours(0,0,0,0);const iso=start.toISOString();const [rounds,missing,moves,checks]=await Promise.all([getRows('/daily_rounds?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,zone,inspection_type,completed_at&order=completed_at.desc'),getRows('/missing_supplies?status=eq.OPEN&select=member_name,item_name,store_or_zone,reported_at&order=reported_at.desc'),getRows('/stock_movements?created_at=gte.'+encodeURIComponent(iso)+'&select=member_name,product_name,movement_type,quantity,created_at&order=created_at.desc'),getRows('/container_checks?completed_at=gte.'+encodeURIComponent(iso)+'&select=member_name,scheduled_time,completed_at&order=completed_at.desc')]);data={rounds,missing,moves,checks};}
    const {rounds,missing,moves,checks}=data,porters=['Walter','Jhomar','Pat'];
    const summaries=porters.map(n=>{const mine=rounds.filter(x=>x.member_name===n),r=mine.filter(isRound).length,insp=mine.filter(isInspection).length,c=checks.filter(x=>x.member_name===n).length+mine.filter(isContainer).length;return `<button type="button" class="porter-detail" data-porter="${n}" style="width:100%;text-align:left;background:transparent;color:inherit;border:0;padding:0"><div class="review"><strong>👷 ${n} ›</strong><div class="muted">Rounds: ${r} · Inspections: ${insp} · Containers: ${c}</div><div class="muted">Tap to view full activity</div></div></button>`}).join('');
    const miss=missing.length?missing.slice(0,6).map(x=>`<div class="review"><strong>⚠️ ${x.item_name}</strong><div class="muted">${x.member_name}${x.store_or_zone?' · '+x.store_or_zone:''}</div></div>`).join(''):'<div class="muted">No open issues.</div>';
    const stock=moves.length?moves.slice(0,6).map(x=>`<div class="review"><strong>${x.movement_type==='TAKE'?'−':'+'} ${x.quantity} · ${x.product_name}</strong><div class="muted">${x.member_name} · ${time(x.created_at)}</div></div>`).join(''):'<div class="muted">No stock movements today.</div>';
    box.innerHTML=`<h2>👁️ Supervisory view</h2><div class="muted">Shared activity for Walter, Jhomar and Pat.</div><h3>Team today</h3>${summaries}<h3>Open reported issues</h3>${miss}<h3>Recent stock activity</h3>${stock}`;
    box.querySelectorAll('.porter-detail').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();porterDetail(b.dataset.porter)}));
  }
  const oldRenderAll=window.renderAll;window.renderAll=function(){oldRenderAll();dashboardBox=null;setTimeout(()=>renderSupervisorDashboard(true),50)};
  const oldChange=window.changePerson;window.changePerson=function(n){oldChange(n);dashboardBox=null;setTimeout(()=>renderSupervisorDashboard(true),100)};
  setTimeout(()=>renderSupervisorDashboard(true),500);
})();