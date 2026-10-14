/* Scenario seed: all figures in this module are generated for product-design analysis, not collected production telemetry. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const format=n=>Math.round(n).toLocaleString("en-US");
const pct=(num,den)=>den?(num/den*100).toFixed(1):"0.0";
const escaped=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* Illustrative campus rollout: April 6 through October 11, 2026 (last
   complete reporting week starts October 5). Slow spring adoption, a summer
   recruiting lull, and renewed fall activity. Weeks 16-27 reconcile exactly
   to the already-agreed 4/8/12-week aggregates. These are NOT real telemetry. */
const userCounts=[3,5,8,11,16,23,27,25,20,16,13,11,9,10,12,14,15,20,27,21,25,28,30,32,41,35,36];
const sessionCounts=[6,12,19,30,36,57,70,59,49,32,31,24,20,23,28,29,34,47,40,57,80,69,74,68,104,81,107];
const jobCounts=[4,8,12,18,24,38,57,41,35,29,22,16,11,17,25,32,38,72,58,42,55,44,69,84,51,72,43];
const taskCounts=[0,1,2,3,5,9,12,10,8,6,5,4,3,5,7,12,14,19,15,17,20,16,22,20,28,19,23];
const returningCounts=[1,1,2,3,4,6,5,5,4,4,3,2,2,3,4,4,6,5,6,7,8,7,9,10,12,11,13];
const jobDetailViews=[8,13,23,32,51,66,82,78,65,49,41,34,29,37,43,48,57,76,103,80,118,129,112,169,188,153,196];
// Distinct-user estimates are cohort-level values, never sums of weekly counts.
const uniquePeriodUsers={4:78,8:99,12:118,27:148};
const priorPeriodUsers={4:62,8:72,12:86};
const launchWeekUTC=Date.UTC(2026,3,6);
const rows=userCounts.map((users,index)=>{
  const n=index+1,jobs=jobCounts[index],sessions=sessionCounts[index];
  const date=new Date(launchWeekUTC+index*7*24*60*60*1000);
  return {
    n,label:date.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),
    users,sessions,jobs,
    tasks:taskCounts[index],
    jobViews:jobDetailViews[index],
    folderOpens:n>=26?Math.round(sessions*.44):0,
    toolClicks:n===26?10:n===27?16:0,
    contacts:n===26?7:n===27?10:Math.round(users*.11),
    returning:returningCounts[index],
    return7:Math.round(returningCounts[index]/users*100),
    priorities:n>=24?[6,9,10,8][n-24]:0
  };
});

/* Two equal 14-day observation windows around an illustrative late-September
   networking-tools release. This compact account/job/contact fixture models
   the fields Applyfolio already saves: contact.last (email/message sent date)
   and contact.followUp. Tool clicks here are synthetic instrumentation, not
   events currently collected by the live Applyfolio application. */
function networkingCohort(kind){
  const after=kind==="after";
  const total=after?67:58,viewers=after?51:44;
  const contactCreators=after?13:7,toolUsers=after?19:0;
  const monday=after?["2026-09-28","2026-10-05"]:["2026-09-14","2026-09-21"];
  const users=Array.from({length:total},(_,i)=>({
    id:kind+"-student-"+(i+1),
    viewedJob:i<viewers,
    toolClicks:[],
    contacts:[]
  }));
  if(after){
    // 19 distinct tool users, 26 clicks (10 then 16 across the two weeks).
    for(let i=0;i<toolUsers;i++){
      const week=(i<5||(i>=9&&i<14))?0:1;
      users[i].toolClicks.push({jobId:"company-"+i,tool:i%2?"ChatGPT":"Apollo",at:monday[week]+"T09:00:00Z"});
      if(i===5||i===6||i>=14)users[i].toolClicks.push({jobId:"company-"+i,tool:i%2?"Apollo":"ChatGPT",at:"2026-10-07T09:00:00Z"});
    }
  }
  const countContactsPerUser=i=>
    after?(i<9?1:(i>=19&&i<23?2:0)):(i<7?(i>=5?2:1):0);
  for(let i=0;i<total;i++){
    if(countContactsPerUser(i)===0)continue;
    const toolAssisted=after&&i<9;
    const week=after?(toolAssisted?(i<5?0:1):(i<21?0:1)):(i<4?0:1);
    const outreach=after?(toolAssisted?i<6:i<22):i<5;
    const followUp=outreach&&(after?(toolAssisted?i<3:i===19):i<2);
    const entries=countContactsPerUser(i);
    for(let k=0;k<entries;k++){
      const savedDate=after?(week===0&&k===0?"2026-09-29":"2026-10-06"):(week===0?"2026-09-16":"2026-09-23");
      const jobId=k===0?"company-"+i:"secondary-company-"+i;
      users[i].contacts.push({
        jobId,savedAt:savedDate+"T12:00:00Z",
        last:k===0&&outreach?savedDate:"",
        followUp:k===0&&followUp?(week===0?(after?"2026-10-06":"2026-09-23"):(after?"2026-10-13":"2026-09-30")):""
      });
    }
  }
  const savedAfterTool=user=>user.contacts.filter(contact=>user.toolClicks.some(click=>
    click.jobId===contact.jobId &&
    new Date(contact.savedAt)>=new Date(click.at) &&
    new Date(contact.savedAt)-new Date(click.at)<=7*86400000
  ));
  const toolContactUsers=users.filter(u=>savedAfterTool(u).length>0);
  const toolOutreachUsers=toolContactUsers.filter(u=>savedAfterTool(u).some(c=>Boolean(c.last)));
  const toolFollowupUsers=toolOutreachUsers.filter(u=>savedAfterTool(u).some(c=>Boolean(c.last&&c.followUp)));
  return {
    users,
    active:users.length,
    jobViewers:users.filter(u=>u.viewedJob).length,
    toolUsers:users.filter(u=>u.toolClicks.length>0).length,
    toolClicks:users.reduce((n,u)=>n+u.toolClicks.length,0),
    contactsAdded:users.reduce((n,u)=>n+u.contacts.length,0),
    contactCreators:users.filter(u=>u.contacts.length>0).length,
    outreachUsers:users.filter(u=>u.contacts.some(c=>Boolean(c.last))).length,
    followupUsers:users.filter(u=>u.contacts.some(c=>Boolean(c.followUp))).length,
    toolContactUsers:toolContactUsers.length,
    toolOutreachUsers:toolOutreachUsers.length,
    toolFollowupUsers:toolFollowupUsers.length
  };
}
const networkingBefore=networkingCohort("before");
const networkingAfter=networkingCohort("after");

const sample={
  networking:{
    title:"Contacts & networking tools",date:"SEP 14–27 / SEP 28–OCT 11",stage:"Two-week cohorts",
    problem:"Contact tracking existed, but students had to leave a job file to research people at a company, then return to save contact details.",
    hypothesis:"Placing Apollo and ChatGPT discovery shortcuts beside each application will help more students save relevant contacts and record that they initiated outreach.",
    metric:"Share of active users who recorded an Email / message sent date on a saved contact.",
    guardrail:"Check contact creation, follow-up scheduling, and ongoing job-tracking activity. A filled outreach date is self-reported, not independently verified.",
    metricTitle:"Users recording outreach",
    before:{n:networkingBefore.outreachUsers,d:networkingBefore.active},
    after:{n:networkingAfter.outreachUsers,d:networkingAfter.active},
    secondary:{title:"Users saving a contact",before:{n:networkingBefore.contactCreators,d:networkingBefore.active},after:{n:networkingAfter.contactCreators,d:networkingAfter.active}},
    funnelTitle:"Networking discovery → outreach",
    funnelSubtitle:"Post-release users; tool-to-contact matches use the same user and job within 7 days.",
    steps:[
      ["Engaged users",networkingAfter.active],
      ["Viewed a job file",networkingAfter.jobViewers],
      ["Opened Apollo or ChatGPT",networkingAfter.toolUsers],
      ["Saved a contact after tool use",networkingAfter.toolContactUsers],
      ["Recorded outreach date",networkingAfter.toolOutreachUsers],
      ["Scheduled follow-up",networkingAfter.toolFollowupUsers]
    ],
    summary:networkingAfter.toolContactUsers+" of "+networkingAfter.toolUsers+
      " tool users saved a contact for the same job within 7 days; "+
      networkingAfter.toolOutreachUsers+" recorded outreach and "+
      networkingAfter.toolFollowupUsers+" scheduled a follow-up. "+
      "The saved-contact stage is a discovery proxy, not verification that a tool found the contact.",
    note:"Pre/post comparison: Sep 14–27 vs Sep 28–Oct 11. Self-reported outreach dates; tool-to-contact proximity does not prove attribution or causation."
  },
  priority:{
    title:"Priority & next steps",date:"NEXT STEPS / RELEASE COMPARISON",stage:"Behavioral readout",
    problem:"Users saved opportunities but could lose track of which applications and tasks required attention first.",
    hypothesis:"A priority toggle, task edit controls, and completion actions will increase on-time task follow-through.",
    metric:"Share of users with scheduled tasks who complete at least one within seven days.",
    guardrail:"Check whether tasks are simply being marked complete without associated application activity.",
    metricTitle:"7-day task completion",
    before:{n:19,d:45},after:{n:26,d:51},
    funnelTitle:"Priority workflow funnel",
    funnelSubtitle:"Users with a scheduled action in the post-release cohort.",
    steps:[["Users with scheduled actions",51],["Viewed next steps",44],["Marked a role as priority",28],["Completed a priority task",17]],
    summary:"17 of 28 users who marked a role as priority completed a linked task. The next question is how clearly the next action is surfaced.",
    note:"Different cohort sizes and nonrandomized periods limit causal interpretation."
  },
  folders:{
    title:"Interactive folders",date:"FOLDERS / RELEASE COMPARISON",stage:"Early readout",
    problem:"The original application list offered limited visual distinction between saved, in-progress, and interviewed roles.",
    hypothesis:"Larger status folders and a more focused job-file view will help users find and reopen relevant opportunities.",
    metric:"Share of application-discovery sessions that lead to opening a job's details, before and after the navigation redesign.",
    guardrail:"Monitor page load and accidental openings; interaction volume alone is not a success measure.",
    metricTitle:"Discovery-to-detail conversion",
    before:{n:81,d:195},after:{n:92,d:202},
    funnelTitle:"Folder discovery funnel",
    funnelSubtitle:"Post-release sessions in the early observation window.",
    steps:[["Eligible sessions",202],["Opened a folder",163],["Browsed job cards",131],["Opened a job file",92]],
    summary:"92 of 202 eligible sessions reached a job file. The comparison uses discovery sessions on either interface and spans a short observation window.",
    note:"This is an early readout with a small time window. More observation is needed before attributing improvement to the redesign."
  }
};
const decisions=[
  {id:"01 / NETWORKING",title:"Turn discovered contacts into outreach",copy:"Users may save a contact without recording any outreach. Test clearer follow-through within the existing contact workflow, then watch recorded messages and follow-up dates.",metric:networkingAfter.toolOutreachUsers+" / "+networkingAfter.toolUsers+" tool users recorded outreach"},
  {id:"02 / TASK WORKFLOW",title:"Make priority more actionable",copy:"Priority works best when it connects directly to the next task. Consider highlighting a pending follow-up inside the priority-marked job file.",metric:"17 / 28 priority users completed a linked task"},
  {id:"03 / DISCOVERY",title:"Optimize scanning before adding motion",copy:"Job-file conversion is more meaningful than the number of folder animations. Measure how quickly users find an application before changing folder behavior again.",metric:"46% discovery-to-detail conversion"}
];
const state={range:27,trend:"users",feature:"networking"};
const sum=(items,key)=>items.reduce((a,item)=>a+item[key],0);
function list(){return rows.slice(-state.range)}
function setDelta(selector,value,suffix="%"){
  const el=$(selector);
  const rounded=Number.isFinite(value)?Math.round(value*10)/10:null;
  el.textContent=rounded==null?"—":(rounded>0?"+":"")+rounded+suffix;
  el.classList.toggle("negative",rounded!=null&&rounded<0);
  el.classList.toggle("neutral",rounded==null||rounded===0);
}
function kpis(){
  const w=list(),sinceLaunch=state.range===27;
  const prior=sinceLaunch?[]:rows.slice(Math.max(0,rows.length-state.range*2),rows.length-state.range);
  const currentUnique=uniquePeriodUsers[state.range],priorUnique=priorPeriodUsers[state.range];
  const average=sum(w,"users")/w.length,priorAverage=prior.length?sum(prior,"users")/prior.length:NaN;
  const saved=sum(w,"jobs"),priorSaved=sum(prior,"jobs");
  const tasks=sum(w,"tasks"),priorTasks=sum(prior,"tasks");
  const retention=sum(w,"returning")/sum(w,"users")*100;
  const priorRetention=prior.length?sum(prior,"returning")/sum(prior,"users")*100:NaN;
  $("#wauValue").textContent=format(average);
  $("#uniqueValue").textContent=format(currentUnique);
  $("#jobsValue").textContent=format(saved);
  $("#jobsPerUserValue").textContent=(saved/currentUnique).toFixed(1);
  $("#taskValue").textContent=format(tasks);
  $("#retentionValue").textContent=Math.round(retention)+"%";

  setDelta("#wauDelta",(average-priorAverage)/priorAverage*100);
  setDelta("#uniqueDelta",(currentUnique-priorUnique)/priorUnique*100);
  setDelta("#jobsDelta",priorSaved?(saved-priorSaved)/priorSaved*100:NaN);
  setDelta("#taskDelta",priorTasks?(tasks-priorTasks)/priorTasks*100:NaN);
  setDelta("#retentionDelta",retention-priorRetention," pp");

  // Since launch has no earlier comparison period.
  ["#wauDelta","#uniqueDelta","#jobsDelta","#taskDelta","#retentionDelta"].forEach(id=>{
    const badge=$(id);
    badge.hidden=sinceLaunch;
    badge.nextElementSibling.textContent=sinceLaunch?"April–October 2026":
      id==="#retentionDelta"?"percentage points vs. preceding window":"vs. preceding equal window";
  });
}
function polylineChart(data,key){
  const width=680,height=237,left=34,right=20,top=16,bottom=30;
  const max=Math.max(10,...data.map(r=>r[key]))*1.15;
  const min=0,innerW=width-left-right,innerH=height-top-bottom;
  const x=i=>left+i*innerW/Math.max(1,data.length-1);
  const y=v=>top+(max-v)/(max-min)*innerH;
  let lines="",labels="",dots="",points="";
  for(let i=0;i<=4;i++){
    const value=max*i/4,yy=y(value);
    lines+='<line class="gridline" x1="'+left+'" x2="'+(width-right)+'" y1="'+yy+'" y2="'+yy+'"/>';
    labels+='<text class="axis-text" x="'+(left-8)+'" y="'+(yy+3)+'" text-anchor="end">'+format(value)+'</text>';
  }
  data.forEach((r,i)=>{
    points+=(i?" ":"")+x(i)+","+y(r[key]);
    const axisStep=Math.max(1,Math.ceil(data.length/6));
    if(i===0||i===data.length-1||(i%axisStep===0&&data.length-1-i>=axisStep))
      labels+='<text class="axis-text" text-anchor="middle" x="'+x(i)+'" y="'+(height-9)+'">'+r.label+'</text>';
    dots+='<circle class="trend-dot" cx="'+x(i)+'" cy="'+y(r[key])+'" r="4" data-point="'+i+'"/>';
  });
  return '<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true">'+lines+labels+'<polyline class="trend-line" points="'+points+'"/>'+dots+'</svg>';
}
function lineChart(){
  const data=list(),labels={users:"Weekly active users",sessions:"Weekly sessions",jobs:"Jobs saved"};
  const box=$("#engagementChart");
  box.innerHTML=polylineChart(data,state.trend);
  const initial=data[0][state.trend],final=data[data.length-1][state.trend];
  const change=Math.round((final-initial)/Math.max(1,initial)*100);
  $("#trendSummary").textContent=labels[state.trend]+": "+format(initial)+" → "+format(final)+" ("+(change>=0?"+":"")+change+"%)";
  box.querySelectorAll("[data-point]").forEach(el=>{
    el.addEventListener("pointerenter",()=>{
      const i=Number(el.dataset.point),item=data[i];
      const tip=document.createElement("div");tip.className="chart-tooltip";tip.textContent=item.label+" · "+format(item[state.trend]);
      const bounds=box.getBoundingClientRect();
      tip.style.left=Math.min(bounds.width-100,Math.max(8,parseFloat(el.getAttribute("cx"))/680*bounds.width-40))+"px";
      tip.style.top=Math.max(0,parseFloat(el.getAttribute("cy"))/237*237-30)+"px";
      box.querySelectorAll(".chart-tooltip").forEach(x=>x.remove());box.appendChild(tip);
    });
    el.addEventListener("pointerleave",()=>box.querySelectorAll(".chart-tooltip").forEach(x=>x.remove()));
  });
}
function workflows(){
  const data=list();
  const usage=[
    ["Job detail views",sum(data,"jobViews")],
    ["Jobs saved",sum(data,"jobs")],
    ["Tasks completed",sum(data,"tasks")],
    ["Networking tool opens",sum(data,"toolClicks")],
    ["Contacts added",sum(data,"contacts")]
  ];
  const largest=Math.max(1,...usage.map(x=>x[1]));
  $("#workflowBars").innerHTML=usage.map(([name,value])=>
    '<div class="workflow-row"><div class="workflow-label"><span>'+escaped(name)+'</span><strong>'+format(value)+'</strong></div>'+
    '<div class="rail"><div class="fill" style="width:'+(value/largest*100).toFixed(1)+'%"></div></div></div>'
  ).join("");
}
function featurePanel(){
  const f=sample[state.feature],before=pct(f.before.n,f.before.d),after=pct(f.after.n,f.after.d);
  const beforeRaw=f.before.n/f.before.d*100,afterRaw=f.after.n/f.after.d*100,difference=afterRaw-beforeRaw;
  $("#featureDate").textContent=f.date;$("#featureStage").textContent=f.stage;
  $("#featureTitle").textContent=f.title;
  $("#featureProblem").textContent=f.problem;
  $("#featureHypothesis").textContent=f.hypothesis;
  $("#featureMetric").textContent=f.metric;
  $("#featureGuardrail").textContent=f.guardrail;
  $("#impactTitle").textContent=f.metricTitle;
  $("#impactBefore").textContent=before+"%";
  $("#impactAfter").textContent=after+"%";
  $("#impactBeforeN").textContent=f.before.n+" / "+f.before.d+(state.feature==="folders"?" sessions":" users");
  $("#impactAfterN").textContent=f.after.n+" / "+f.after.d+(state.feature==="folders"?" sessions":" users");
  $("#beforeBar").style.width=beforeRaw+"%";
  $("#afterBar").style.width=afterRaw+"%";
  $("#impactLift").textContent=(difference>0?"+":"")+difference.toFixed(1)+" pp";
  $("#impactLift").classList.toggle("lower",difference<0);
  $("#impactNote").textContent=f.note;
  const secondary=$("#impactSecondary");
  secondary.hidden=!f.secondary;
  if(f.secondary){
    const b=f.secondary.before,a=f.secondary.after;
    $("#secondaryLabel").textContent=f.secondary.title;
    $("#secondaryValue").textContent=pct(b.n,b.d)+"% → "+pct(a.n,a.d)+"%";
    $("#secondaryCounts").textContent=b.n+"/"+b.d+" before · "+a.n+"/"+a.d+" after";
  }
  $("#funnelTitle").textContent=f.funnelTitle;
  $("#funnelSubtitle").textContent=f.funnelSubtitle;
  const base=f.steps[0][1];
  $("#funnelChart").innerHTML=f.steps.map(([name,value])=>
    '<div class="funnel-item"><div class="funnel-info"><div><span>'+escaped(name)+'</span><strong>'+format(value)+'</strong></div>'+
    '<div class="funnel-bar"><div style="width:'+(value/base*100).toFixed(1)+'%"></div></div></div>'+
    '<div class="funnel-meta">'+Math.round(value/base*100)+'% of entry</div></div>'
  ).join("");
  $("#funnelSummary").textContent=f.summary;
  $$("[data-feature]").forEach(button=>{
    const active=button.dataset.feature===state.feature;
    button.classList.toggle("active",active);
    button.setAttribute("aria-selected",String(active));
  });
}
function retentionChart(){
  const recent=rows.slice(-15),values=recent.map(x=>x.return7);
  const W=550,H=112,top=9,left=8,step=(W-16)/(values.length-1);
  const xy=values.map((v,i)=>[left+i*step,H-15-(v-15)/(45-15)*(H-25)]);
  const path=xy.map((v,i)=>(i?"L":"M")+v[0].toFixed(1)+" "+v[1].toFixed(1)).join(" ");
  const markerIndex=13,markerX=xy[markerIndex]?.[0]||200;
  $("#retentionChart").innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">'+
    '<line x1="0" x2="'+W+'" y1="89" y2="89" stroke="#eee8e2"/>'+
    '<line x1="'+markerX+'" x2="'+markerX+'" y1="0" y2="96" stroke="#b6aca1" stroke-dasharray="3 4"/>'+
    '<path d="'+path+'" fill="none" stroke="#a5bcd6" stroke-width="3" stroke-linejoin="round"/>'+
    '<circle cx="'+xy[xy.length-1][0]+'" cy="'+xy[xy.length-1][1]+'" r="4" fill="#4d0e12"/>'+
    '<text x="10" y="108" fill="#9e9286" font-size="10">'+recent[0].label+'</text>'+
    '<text x="'+(W-40)+'" y="108" fill="#9e9286" font-size="10">'+recent[recent.length-1].label+'</text></svg>';
}
function decisionsPanel(){
  $("#decisionCards").innerHTML=decisions.map(x=>
    '<article class="decision"><div class="decision-num">'+escaped(x.id)+'</div><h3>'+escaped(x.title)+'</h3>'+
    '<p>'+escaped(x.copy)+'</p><div class="decision-metric">'+escaped(x.metric)+'</div></article>'
  ).join("");
}
function refresh(){kpis();lineChart();workflows();featurePanel();}
$("#rangeSelect").addEventListener("change",e=>{state.range=Number(e.target.value);refresh();});
$$("[data-trend]").forEach(button=>button.addEventListener("click",()=>{
  state.trend=button.dataset.trend;
  $$("[data-trend]").forEach(b=>{const on=b.dataset.trend===state.trend;b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on));});
  lineChart();
}));
$$("[data-feature]").forEach(button=>button.addEventListener("click",()=>{
  state.feature=button.dataset.feature;featurePanel();
}));
$$(".nav-link").forEach(link=>link.addEventListener("click",()=>{
  $$(".nav-link").forEach(el=>el.classList.toggle("active",el===link));
}));
decisionsPanel();retentionChart();refresh();
})();
