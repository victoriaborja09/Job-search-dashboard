/* Scenario seed: all figures in this module are generated for product-design analysis, not collected production telemetry. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const format=n=>Math.round(n).toLocaleString("en-US");
const pct=(num,den)=>den?Math.round(num/den*100):0;
const escaped=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rows=Array.from({length:24},(_,index)=>{
  const n=index+1;
  const users=Math.max(30,Math.round(42+n*2.05+Math.sin(n*1.3)*3+(n>=17?7:0)));
  return {
    n,label:"W"+String(n).padStart(2,"0"),
    users,
    sessions:Math.round(users*(2.2+n*.035)),
    jobs:Math.round(users*(1.91+n*.018)),
    tasks:Math.round(users*(1.12+n*.03)),
    jobViews:Math.round(users*(2.5+n*.058)),
    folderOpens:n>=23?Math.round(users*1.62):Math.round(users*.95),
    toolClicks:n>=17?Math.round(users*.69):0,
    contacts:n>=17?Math.round(users*.38):Math.round(users*.18),
    return7:Math.min(60,Math.round(42+n*.48+(n>=17?3:0))),
    priorities:n>=20?Math.round(users*.35):0
  };
});
rows[23].users=101;
rows[23].sessions=338;
rows[23].jobs=252;
rows[23].tasks=194;
rows[23].jobViews=389;
rows[23].folderOpens=167;
rows[23].toolClicks=69;
rows[23].contacts=54;
rows[23].return7=58;
const sample={
  networking:{
    title:"Contacts & networking tools",date:"W17 / FEATURE RELEASE",stage:"Follow-up analysis",
    problem:"Basic contact tracking was available, but finding relevant people still required a separate research workflow.",
    hypothesis:"Putting Apollo and a tailored ChatGPT connection-research prompt beside saved contacts will increase the share of engaged users who record a professional contact.",
    metric:"Share of engaged users who save at least one contact within the measurement window.",
    guardrail:"Monitor return rate and whether users still complete core job-tracking tasks.",
    metricTitle:"Users recording a contact",
    before:{n:27,d:168},after:{n:74,d:211},
    funnelTitle:"Networking adoption funnel",
    funnelSubtitle:"Distinct users in the post-release observation cohort.",
    steps:[["Engaged users",211],["Viewed a job file",173],["Opened Apollo / ChatGPT",93],["Saved a contact after tool use",41]],
    summary:"41 of 93 networking-tool users subsequently saved a contact (44%). Helping people move from research to recordkeeping is the next opportunity.",
    note:"Pre/post cohorts were not randomized. The change is descriptive and may reflect user mix or timing, not just the release."
  },
  priority:{
    title:"Priority & next steps",date:"W20 / FEATURE RELEASE",stage:"Behavioral readout",
    problem:"Users saved opportunities but could lose track of which applications and tasks required attention first.",
    hypothesis:"A priority toggle, task edit controls, and completion actions will increase on-time task follow-through.",
    metric:"Share of users with scheduled tasks who complete at least one within seven days.",
    guardrail:"Check whether tasks are simply being marked complete without associated application activity.",
    metricTitle:"7-day task completion",
    before:{n:50,d:115},after:{n:71,d:125},
    funnelTitle:"Priority workflow funnel",
    funnelSubtitle:"Users with a scheduled action in the post-release cohort.",
    steps:[["Users with scheduled actions",125],["Viewed next steps",100],["Marked a role as priority",62],["Completed a priority task",42]],
    summary:"42 of 62 users who assigned priority completed a linked task. The next test is whether the priority signal is visible enough in folder view.",
    note:"Different cohort sizes and nonrandomized periods limit causal interpretation."
  },
  folders:{
    title:"Interactive folders",date:"W23 / FEATURE RELEASE",stage:"Early readout",
    problem:"The original application list offered limited visual distinction between saved, in-progress, and interviewed roles.",
    hypothesis:"Larger status folders and a more focused job-file view will help users find and reopen relevant opportunities.",
    metric:"Share of application-discovery sessions that lead to opening a job's details, before and after the navigation redesign.",
    guardrail:"Monitor page load and accidental openings; interaction volume alone is not a success measure.",
    metricTitle:"Discovery-to-detail conversion",
    before:{n:62,d:154},after:{n:76,d:169},
    funnelTitle:"Folder discovery funnel",
    funnelSubtitle:"Post-release sessions in the early observation window.",
    steps:[["Eligible sessions",169],["Opened a folder",150],["Browsed job cards",102],["Opened a job file",76]],
    summary:"76 of 169 eligible sessions reached a job file. The comparison uses discovery sessions on either interface and spans a short observation window.",
    note:"This is an early readout with a small time window. More observation is needed before attributing improvement to the redesign."
  }
};
const decisions=[
  {id:"01 / NETWORKING",title:"Reduce the tool-to-contact gap",copy:"Research tools generate interest, but many users do not save a contact afterward. Test a clearer Add contact action alongside the networking tools.",metric:"41 / 93 tool users saved a contact"},
  {id:"02 / TASK WORKFLOW",title:"Make priority more actionable",copy:"Priority works best when it connects directly to the next task. Consider highlighting a pending follow-up inside the priority-marked job file.",metric:"42 / 62 priority users completed a linked task"},
  {id:"03 / DISCOVERY",title:"Optimize scanning before adding motion",copy:"Job-file conversion is more meaningful than the number of folder animations. Measure how quickly users find an application before changing folder behavior again.",metric:"45% folder-to-detail conversion"}
];
const taxonomy=[
  ["job_created","A new job is saved successfully","job_id, role_type, city, source"],
  ["job_detail_opened","A user opens an individual job file","job_id, entry_surface, status"],
  ["folder_opened","A status folder opens","folder_status, item_count"],
  ["networking_tool_opened","Apollo or ChatGPT connections tool is clicked","job_id, tool_name"],
  ["contact_created","A contact record is saved to a job","job_id, contact_id"],
  ["priority_updated","Priority is enabled or disabled for a job","job_id, priority_state"],
  ["task_completed","A tracked timeline task is marked complete","job_id, task_id, completion_time"],
  ["session_started","First meaningful activity after a period of inactivity","account_id, device_type"]
];
const state={range:8,trend:"users",feature:"networking"};
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
  const w=list(),latest=w[w.length-1],previous=w[w.length-2];
  const prior=rows.slice(Math.max(0,rows.length-state.range*2),rows.length-state.range);
  $("#wauValue").textContent=format(latest.users);
  $("#jobsValue").textContent=format(sum(w,"jobs"));
  $("#taskValue").textContent=format(sum(w,"tasks"));
  $("#retentionValue").textContent=latest.return7+"%";
  setDelta("#wauDelta",(latest.users-previous.users)/previous.users*100);
  const jobsPrior=sum(prior,"jobs"),tasksPrior=sum(prior,"tasks");
  setDelta("#jobsDelta",jobsPrior&&prior.length===w.length?(sum(w,"jobs")-jobsPrior)/jobsPrior*100:NaN);
  setDelta("#taskDelta",tasksPrior&&prior.length===w.length?(sum(w,"tasks")-tasksPrior)/tasksPrior*100:NaN);
  setDelta("#retentionDelta",latest.return7-previous.return7," pp");
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
    if(i===0||i===data.length-1||i%Math.max(1,Math.ceil(data.length/6))===0)
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
  const values=rows.slice(12).map(x=>x.return7);
  const W=550,H=112,top=9,left=8,step=(W-16)/(values.length-1);
  const xy=values.map((v,i)=>[left+i*step,H-15-(v-35)/(65-35)*(H-25)]);
  const path=xy.map((v,i)=>(i?"L":"M")+v[0].toFixed(1)+" "+v[1].toFixed(1)).join(" ");
  const markerIndex=4,markerX=xy[markerIndex]?.[0]||200;
  $("#retentionChart").innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">'+
    '<line x1="0" x2="'+W+'" y1="89" y2="89" stroke="#eee8e2"/>'+
    '<line x1="'+markerX+'" x2="'+markerX+'" y1="0" y2="96" stroke="#b6aca1" stroke-dasharray="3 4"/>'+
    '<path d="'+path+'" fill="none" stroke="#a5bcd6" stroke-width="3" stroke-linejoin="round"/>'+
    '<circle cx="'+xy[xy.length-1][0]+'" cy="'+xy[xy.length-1][1]+'" r="4" fill="#4d0e12"/>'+
    '<text x="10" y="108" fill="#9e9286" font-size="10">W13</text>'+
    '<text x="'+(W-40)+'" y="108" fill="#9e9286" font-size="10">W24</text></svg>';
}
function decisionsPanel(){
  $("#decisionCards").innerHTML=decisions.map(x=>
    '<article class="decision"><div class="decision-num">'+escaped(x.id)+'</div><h3>'+escaped(x.title)+'</h3>'+
    '<p>'+escaped(x.copy)+'</p><div class="decision-metric">'+escaped(x.metric)+'</div></article>'
  ).join("");
}
function eventsPanel(){
  $("#eventTable").innerHTML=taxonomy.map(([name,trigger,properties])=>
    "<tr><td>"+escaped(name)+"</td><td>"+escaped(trigger)+"</td><td>"+escaped(properties)+"</td></tr>"
  ).join("");
}
function exportCsv(){
  const data=list();
  const headings=["week","weekly_active_users","sessions","jobs_saved","tasks_completed","job_detail_opens","folder_opens","networking_tool_opens","contacts_added","seven_day_return_rate_pct","priority_updates"];
  const fields=["label","users","sessions","jobs","tasks","jobViews","folderOpens","toolClicks","contacts","return7","priorities"];
  const csv=[headings.join(","),...data.map(row=>fields.map(key=>row[key]).join(","))].join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="applyfolio-analytics-"+state.range+"-weeks.csv";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
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
$("#toggleEvents").addEventListener("click",()=>{
  const panel=$("#eventDetails");panel.hidden=!panel.hidden;
  $("#toggleEvents").setAttribute("aria-expanded",String(!panel.hidden));
  $("#eventsChevron").textContent=panel.hidden?"⌄":"⌃";
});
$("#exportBtn").addEventListener("click",exportCsv);
$$(".nav-link").forEach(link=>link.addEventListener("click",()=>{
  $$(".nav-link").forEach(el=>el.classList.toggle("active",el===link));
}));
decisionsPanel();eventsPanel();retentionChart();refresh();
})();
