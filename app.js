const SUPABASE_URL = "https://jnbtgmnymtxgzhfdpxhh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gG9G5EouVZ_pXubXags00Q_3zhl6Bvg";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const STORAGE_KEY = "job-search-dashboard-v2";
const SHORTCUTS_KEY = "job-search-dashboard-shortcuts-v1";
const OFFERS_KEY = "job-search-dashboard-offers-v1";
const ONBOARDING_KEY = "job-search-dashboard-onboarding-v1";
const PENDING_EMAIL_KEY = "job-search-dashboard-pending-email-v1";

const DEFAULT_JOBS = [];

const DEFAULT_SHORTCUTS = [
  {id:"linkedin",name:"LinkedIn Jobs",description:"Search and save roles",url:"https://www.linkedin.com/jobs/",fixed:true},
  {id:"handshake",name:"Handshake",description:"Campus and early-career jobs",url:"https://joinhandshake.com/",fixed:true},
  {id:"docs",name:"Google Docs",description:"Resumes, cover letters, and recruiting notes",url:"https://docs.google.com/",fixed:true}
];

const SAMPLE_OFFERS = [
  {id:"offer-a",company:"Offer A",role:"Product Analyst",city:"New York",base:115000,bonus:10000,tax:35.5,rent:2400,fixed:1650},
  {id:"offer-b",company:"Offer B",role:"Strategy Associate",city:"San Francisco",base:130000,bonus:5000,tax:38.6,rent:3100,fixed:1500}
];

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function localToday(){
  const d=new Date();
  d.setHours(0,0,0,0);
  return d;
}

function localDateISO(date=new Date()){
  const d=new Date(date);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function parseDateOnly(value){
  const raw=String(value||"").trim();
  if(!raw) return null;
  const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso){
    const d=new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d=new Date(raw);
  if(Number.isNaN(d.getTime())) return null;
  d.setHours(0,0,0,0);
  return d;
}

function dayDifference(from,to){
  const a=new Date(from);
  const b=new Date(to);
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  return Math.round((b-a)/86400000);
}

function inferCreatedAt(saved){
  const today=localToday();
  const raw=String(saved||"").toLowerCase();
  const match=raw.match(/(\d+)\s+day/);
  if(match){
    today.setDate(today.getDate()-Number(match[1]));
  }
  return localDateISO(today);
}

function inferDeadlineDate(deadline,createdAt){
  const raw=String(deadline||"").trim();
  if(!raw || /^no deadline$/i.test(raw)) return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const relative=raw.match(/in\s+(\d+)\s+day/i);
  if(relative){
    const base=parseDateOnly(createdAt) || localToday();
    base.setDate(base.getDate()+Number(relative[1]));
    return localDateISO(base);
  }

  const parsed=parseDateOnly(raw);
  return parsed ? localDateISO(parsed) : "";
}

function savedAgeDays(job){
  const savedDate=parseDateOnly(job.createdAt) || localToday();
  return Math.max(0,dayDifference(savedDate,localToday()));
}

function savedLabel(job){
  const days=savedAgeDays(job);
  if(days===0) return "Just now";
  if(days===1) return "1 day ago";
  return `${days} days ago`;
}

function deadlineDateForJob(job){
  return parseDateOnly(job.deadlineDate || inferDeadlineDate(job.deadline,job.createdAt));
}

function deadlineDays(job){
  const d=deadlineDateForJob(job);
  return d ? dayDifference(localToday(),d) : NaN;
}

function displayDeadline(job){
  const d=deadlineDateForJob(job);
  return d ? d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : (job.deadline || "No deadline");
}

function contactFollowUpInfo(job){
  let best=null;

  for(const contact of job.contacts || []){
    let dueDate=null;
    let reason="";

    const explicit=parseDateOnly(contact.followUp);
    const last=parseDateOnly(contact.last);

    if(explicit && explicit<=localToday()){
      dueDate=explicit;
      reason="scheduled";
    }

    if(last){
      const auto=new Date(last);
      auto.setDate(auto.getDate()+7);
      auto.setHours(0,0,0,0);
      if(auto<=localToday() && (!dueDate || auto<dueDate)){
        dueDate=auto;
        reason="one-week";
      }
    }

    if(dueDate && (!best || dueDate<best.date)){
      best={job,contact,date:dueDate,reason};
    }
  }

  return best;
}

function latestJobActivityDate(job){
  const dates=(job.timeline || [])
    .map(item=>parseDateOnly(item.date))
    .filter(Boolean);

  const created=parseDateOnly(job.createdAt);
  if(created) dates.push(created);
  if(!dates.length) return localToday();

  return dates.sort((a,b)=>b-a)[0];
}

function staleJobDays(job){
  if(!["Saved","Applying","Applied"].includes(job.status)) return -1;
  return Math.max(0,dayDifference(latestJobActivityDate(job),localToday()));
}

function urgentTasksForJob(job){
  if(job.archived || job.status==="Closed") return [];

  const tasks=[];

  // A next action becomes urgent five days before it is due and stays urgent
  // after the due date until the user changes/completes the next action.
  const nextDue=parseDateOnly(job.nextDue);
  if(nextDue){
    const days=dayDifference(localToday(),nextDue);
    if(days<=5){
      tasks.push({
        job,
        type:"next",
        label:job.next || "Next action",
        dueDate:nextDue,
        days
      });
    }
  }

  // An application deadline matters while the job is still being pursued.
  // Once the application has been submitted, the old application deadline
  // should no longer keep the job in the urgent bucket.
  if(["Saved","Applying"].includes(job.status)){
    const applicationDeadline=deadlineDateForJob(job);
    const sameAsNextAction = applicationDeadline && nextDue &&
      localDateISO(applicationDeadline)===localDateISO(nextDue);

    if(applicationDeadline && !sameAsNextAction){
      const days=dayDifference(localToday(),applicationDeadline);
      if(days<=5){
        tasks.push({
          job,
          type:"deadline",
          label:"Application deadline",
          dueDate:applicationDeadline,
          days
        });
      }
    }
  }

  return tasks;
}

function urgentTasks(){
  return activeJobs()
    .flatMap(urgentTasksForJob)
    .sort((a,b)=>a.dueDate-b.dueDate);
}

function dueTiming(days){
  if(days<0){
    const overdue=Math.abs(days);
    return overdue===1 ? "1 day overdue" : `${overdue} days overdue`;
  }
  if(days===0) return "today";
  if(days===1) return "tomorrow";
  return `in ${days} days`;
}

function taskDueLabel(task){
  const date=task.dueDate.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  if(task.days<0){
    const past=Math.abs(task.days);
    return `Past due · ${date}${past ? ` · ${past} day${past===1?"":"s"}` : ""}`;
  }
  if(task.days===0) return `Due today · ${date}`;
  if(task.days===1) return `Due tomorrow · ${date}`;
  return `Due in ${task.days} days · ${date}`;
}

function renderUrgentTasks(){
  const tasks=urgentTasks();
  const count=document.getElementById("urgentTaskCount");
  const list=document.getElementById("urgentTaskList");
  if(!count || !list) return;

  count.textContent=`${tasks.length} task${tasks.length===1?"":"s"}`;

  if(!tasks.length){
    list.innerHTML=`
      <div class="task-empty">
        <h3>Nothing needs attention right now</h3>
        <p>No tracked task or application deadline is due within the next five days.</p>
      </div>
    `;
    return;
  }

  list.innerHTML=tasks.map((task,index)=>{
    const detail=task.type==="next"
      ? (task.job.nextDetail || "")
      : "Application deadline";

    return `
      <button type="button" class="task-row ${task.days<0?"task-past-due":""}" data-task-index="${index}">
        <div class="task-main">
          <div class="task-name">${escapeHTML(task.label)}</div>
          <div class="task-job">${escapeHTML(task.job.company)} · ${escapeHTML(task.job.role)}</div>
          ${detail && detail!==task.label ? `<div class="task-detail">${escapeHTML(detail)}</div>` : ""}
        </div>
        <div class="task-meta">
          <span class="task-due ${task.days<0?"past":task.days===0?"today":""}">${escapeHTML(taskDueLabel(task))}</span>
          <span class="task-arrow">→</span>
        </div>
      </button>
    `;
  }).join("");

  list.querySelectorAll("[data-task-index]").forEach(row=>{
    row.onclick=()=>{
      const task=tasks[Number(row.dataset.taskIndex)];
      if(task) openJob(task.job.id,"tasks");
    };
  });
}

function jobNeedsAttention(job){
  if(urgentTasksForJob(job).length) return true;
  if(contactFollowUpInfo(job)) return true;
  if(staleJobDays(job)>=7) return true;
  return false;
}

function normalizeContact(contact){
  if(Array.isArray(contact)){
    return {name:contact[0] || "Contact", role:contact[1] || "", link:"", last:"", followUp:""};
  }
  return {
    name:contact?.name || "Contact",
    role:contact?.role || "",
    link:contact?.link || "",
    last:contact?.last || "",
    followUp:contact?.followUp || ""
  };
}

function normalizeTimelineEntry(entry){
  if(Array.isArray(entry)){
    return {title:entry[0] || "Activity", detail:entry[1] || "", date:"", type:"Custom"};
  }
  return {
    title:entry?.title || "Activity",
    detail:entry?.detail || "",
    date:entry?.date || "",
    type:entry?.type || "Custom"
  };
}

function normalizeJob(job){
  const createdAt=job.createdAt || inferCreatedAt(job.saved);
  const deadlineDate=job.deadlineDate || inferDeadlineDate(job.deadline,createdAt);

  return {
    id:job.id || "job"+Date.now()+Math.random().toString(16).slice(2),
    company:job.company || "New company",
    role:job.role || "New role",
    city:job.city || "",
    industry:job.industry || "",
    function:job.function || "",
    status:job.status || "Saved",
    saved:job.saved || "Just now",
    createdAt,
    deadline:job.deadline || "No deadline",
    deadlineDate,
    highPriority:Boolean(job.highPriority),
    source:job.source || "Manual",
    comp:job.comp || "Not added",
    attention:Boolean(job.attention),
    next:job.next || "Review role",
    nextDetail:job.nextDetail || "Add the next step you want to take.",
    nextDue:job.nextDue || "",
    jobUrl:job.jobUrl || "",
    resumeUrl:job.resumeUrl || "",
    notes:job.notes || "",
    contacts:(job.contacts || []).map(normalizeContact),
    timeline:Array.isArray(job.timeline) ? job.timeline.map(normalizeTimelineEntry) : [normalizeTimelineEntry(["Saved role","Added to dashboard."])],
    archived:Boolean(job.archived)
  };
}

function loadJSON(key, fallback){
  try{
    const stored=localStorage.getItem(key);
    return stored ? JSON.parse(stored) : clone(fallback);
  }catch{
    return clone(fallback);
  }
}

let jobs = loadJSON(STORAGE_KEY, DEFAULT_JOBS).map(normalizeJob);
let shortcuts = loadJSON(SHORTCUTS_KEY, DEFAULT_SHORTCUTS);
let offers = loadJSON(OFFERS_KEY, []);

let activeStatusFilter = "All";
let activeDimensionFilter = null;
let activeUrgentJobIds = null;
let activeJobId = null;
let detailReturnPage = "jobs";
let editingJobId = null;
let editingShortcuts = false;
let currentUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let authMode = "signin";

function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));

  if(currentUser && cloudReady){
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer=setTimeout(()=>saveCloudState(),250);
  }
}

async function saveCloudState(){
  if(!currentUser) return;

  const {error}=await supabaseClient
    .from("user_state")
    .upsert({
      user_id:currentUser.id,
      jobs,
      shortcuts,
      offers,
      onboarding_complete:localStorage.getItem(ONBOARDING_KEY)==="true"
    },{onConflict:"user_id"});

  if(error){
    console.error("Cloud save failed",error);
    toast("Could not sync changes");
  }
}

async function loadCloudState(user){
  cloudReady=false;

  const {data,error}=await supabaseClient
    .from("user_state")
    .select("jobs,shortcuts,offers,onboarding_complete")
    .eq("user_id",user.id)
    .maybeSingle();

  if(error){
    console.error("Cloud load failed",error);
    throw error;
  }

  if(data){
    jobs=(Array.isArray(data.jobs)?data.jobs:[]).map(normalizeJob);
    shortcuts=Array.isArray(data.shortcuts)?data.shortcuts:clone(DEFAULT_SHORTCUTS);
    offers=Array.isArray(data.offers)?data.offers:[];
    localStorage.setItem(STORAGE_KEY,JSON.stringify(jobs));
    localStorage.setItem(SHORTCUTS_KEY,JSON.stringify(shortcuts));
    localStorage.setItem(OFFERS_KEY,JSON.stringify(offers));
    if(data.onboarding_complete) localStorage.setItem(ONBOARDING_KEY,"true");
  }else{
    await supabaseClient.from("user_state").insert({
      user_id:user.id,
      jobs,
      shortcuts,
      offers,
      onboarding_complete:localStorage.getItem(ONBOARDING_KEY)==="true"
    });
  }

  cloudReady=true;
}

function toast(message){
  const el=document.createElement("div");
  el.className="toast";
  el.textContent=message;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1800);
}

const statusClass = s => ({
  Saved:"status-saved",
  Applying:"status-applying",
  Applied:"status-applied",
  Interviewing:"status-interview",
  Offer:"status-offer",
  Closed:"status-closed"
}[s] || "status-saved");

function safeRender(label,fn){
  try{
    fn();
  }catch(err){
    console.error(label,err);
  }
}

function go(page){
  const target=document.getElementById(page);
  if(!target) return;

  // Navigation must never depend on a chart/widget successfully rendering.
  document.querySelectorAll(".section").forEach(section=>section.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".nav button").forEach(button=>{
    button.classList.toggle("active",button.dataset.page===page);
  });

  // Render after the destination is already visible.
  if(page==="dashboard") safeRender("dashboard render failed",refreshDashboard);
  if(page==="tasks") safeRender("tasks render failed",renderUrgentTasks);
  if(page==="jobs") safeRender("jobs render failed",renderJobs);
  if(page==="compare") safeRender("offers render failed",renderOffers);

  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav button").forEach(button=>{
  button.type="button";
  button.addEventListener("click",event=>{
    event.preventDefault();

    const page=button.dataset.page;
    if(page==="jobs"){
      activeUrgentJobIds=null;
      activeStatusFilter="All";
      activeDimensionFilter=null;
      syncChips();
    }

    go(page);
  });
});

function activeJobs(){
  return jobs.filter(j=>!j.archived);
}

function updateCounts(){
  const current=activeJobs();
  document.getElementById("savedCount").textContent=current.filter(j=>j.status==="Saved").length;
  document.getElementById("appliedCount").textContent=current.filter(j=>j.status==="Applied").length;
  document.getElementById("interviewCount").textContent=current.filter(j=>j.status==="Interviewing").length;
  document.getElementById("attentionCount").textContent=current.filter(jobNeedsAttention).length;
}

function distribution(key){
  const counts={};
  activeJobs().forEach(j=>{
    const value=String(j[key] || "").trim();
    if(!value) return;
    counts[value]=(counts[value]||0)+1;
  });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
}

const palette=["#284b59","#b98a46","#9d645a","#6a5e88","#6f8a72","#b7a89a","#4f7d8b"];

function polarPoint(cx,cy,r,angle){
  const rad=(angle-90)*Math.PI/180;
  return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};
}

function donutPath(cx,cy,outerR,innerR,startAngle,endAngle){
  const cappedEnd=endAngle-startAngle>=360 ? startAngle+359.999 : endAngle;
  const p1=polarPoint(cx,cy,outerR,startAngle);
  const p2=polarPoint(cx,cy,outerR,cappedEnd);
  const p3=polarPoint(cx,cy,innerR,cappedEnd);
  const p4=polarPoint(cx,cy,innerR,startAngle);
  const largeArc=(cappedEnd-startAngle)>180 ? 1 : 0;
  return [
    "M",p1.x,p1.y,
    "A",outerR,outerR,0,largeArc,1,p2.x,p2.y,
    "L",p3.x,p3.y,
    "A",innerR,innerR,0,largeArc,0,p4.x,p4.y,
    "Z"
  ].join(" ");
}

function applyDimensionFilter(key,value){
  activeStatusFilter="All";
  activeUrgentJobIds=null;
  activeDimensionFilter={key,value};
  syncChips();
  renderJobs();
  go("jobs");
}

function renderDonut(key, donutId, legendId, totalId){
  const vals=distribution(key);
  const total=vals.reduce((sum,[,count])=>sum+count,0);
  const host=document.getElementById(donutId);
  const legend=document.getElementById(legendId);

  if(!host || !legend) return;

  // Important: renderDonut replaces the contents of the donut container.
  // Therefore the total element must be recreated on every render instead
  // of looking it up before render. This keeps blank -> first-job updates live.
  if(!total){
    host.style.background="transparent";
    host.innerHTML=`
      <svg viewBox="0 0 150 150" aria-label="${escapeHTML(key)} breakdown">
        <circle cx="75" cy="75" r="49" fill="none" stroke="#eee6db" stroke-width="28"></circle>
      </svg>
      <div class="donut-center">
        <div><strong id="${totalId}">0</strong><span>jobs</span></div>
      </div>
    `;
    legend.innerHTML="<span class='small'>No jobs yet</span>";
    return;
  }

  host.style.background="transparent";
  let angle=0;

  const paths=vals.map(([name,count],i)=>{
    const fraction=count/total;
    const startAngle=angle;
    const endAngle=angle+(fraction*360);
    angle=endAngle;
    const pct=Math.round(fraction*100);

    return `<path
      class="donut-segment"
      tabindex="0"
      role="button"
      aria-label="${escapeHTML(name)}: ${pct}%"
      data-key="${escapeHTML(key)}"
      data-value="${escapeHTML(name)}"
      data-label="${escapeHTML(name)}"
      data-pct="${pct}"
      fill="${palette[i%palette.length]}"
      d="${donutPath(75,75,63,35,startAngle,endAngle)}"></path>`;
  }).join("");

  host.innerHTML=`
    <svg viewBox="0 0 150 150" aria-label="${escapeHTML(key)} breakdown">
      ${paths}
    </svg>
    <div class="donut-center">
      <div><strong id="${totalId}">${total}</strong><span>jobs</span></div>
    </div>
    <div class="donut-tooltip"></div>
  `;

  const tooltip=host.querySelector(".donut-tooltip");
  const segments=[...host.querySelectorAll(".donut-segment")];

  function show(seg){
    if(!tooltip) return;
    tooltip.textContent=`${seg.dataset.pct}% ${seg.dataset.label}`;
    tooltip.classList.add("show");
    segments.forEach(s=>s.classList.toggle("is-dimmed",s!==seg));
  }

  function hide(){
    if(tooltip) tooltip.classList.remove("show");
    segments.forEach(s=>s.classList.remove("is-dimmed"));
  }

  segments.forEach(seg=>{
    seg.addEventListener("mouseenter",()=>show(seg));
    seg.addEventListener("mouseleave",hide);
    seg.addEventListener("focus",()=>show(seg));
    seg.addEventListener("blur",hide);
    seg.addEventListener("click",()=>applyDimensionFilter(seg.dataset.key,seg.dataset.value));
    seg.addEventListener("keydown",e=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        applyDimensionFilter(seg.dataset.key,seg.dataset.value);
      }
    });
  });

  legend.innerHTML=vals.map(([name,count],i)=>{
    const pct=Math.round(count/total*100);
    return `<button class="legend-button" data-key="${escapeHTML(key)}" data-value="${escapeHTML(name)}">
      <span class="legend-row">
        <span class="dot" style="background:${palette[i%palette.length]}"></span>
        <span>${escapeHTML(name)}</span>
        <strong>${pct}%</strong>
      </span>
    </button>`;
  }).join("");

  legend.querySelectorAll(".legend-button").forEach(btn=>{
    btn.onclick=()=>applyDimensionFilter(btn.dataset.key,btn.dataset.value);
  });
}

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g,ch=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[ch]));
}

function safeURL(url){
  const raw=String(url||"").trim();
  if(!raw) return "";
  try{
    const u=new URL(raw);
    return ["http:","https:","mailto:"].includes(u.protocol) ? u.href : "";
  }catch{
    return "";
  }
}

function renderAttention(){
  const current=activeJobs();
  const urgent=urgentTasks();

  const followup=current
    .map(job=>contactFollowUpInfo(job))
    .filter(Boolean)
    .sort((a,b)=>a.date-b.date)[0] || null;

  const staleEntry=current
    .map(job=>({job,days:staleJobDays(job)}))
    .filter(item=>item.days>=7)
    .sort((a,b)=>b.days-a.days)[0];

  const cards=[];

  if(urgent.length===1){
    const task=urgent[0];
    cards.push({
      cls:"deadline",
      title:"1 task needs attention",
      text:`<strong>${escapeHTML(task.label)}</strong> for ${escapeHTML(task.job.company)} · ${escapeHTML(task.job.role)} is ${escapeHTML(taskDueLabel(task).toLowerCase())}. Click to open your task list.`,
      id:"",
      openTasks:true
    });
  }else if(urgent.length>1){
    cards.push({
      cls:"deadline",
      title:"Tasks need attention",
      text:`You have <strong>${urgent.length} tasks</strong> that are due soon or still need action. Click to see the full task list.`,
      id:"",
      openTasks:true
    });
  }else{
    cards.push({
      cls:"deadline empty",
      title:"No urgent deadlines",
      text:"Nothing is due within the next five days.",
      id:"",
      openTasks:false
    });
  }

  if(followup){
    const sentDays=followup.contact.last
      ? dayDifference(parseDateOnly(followup.contact.last),localToday())
      : null;
    const timing=followup.reason==="one-week" && Number.isFinite(sentDays)
      ? `It has been ${sentDays} day${sentDays===1?"":"s"} since your last message.`
      : "Your planned follow-up date has arrived.";

    cards.push({
      cls:"followup",
      title:"Follow-up due",
      text:`<strong>${escapeHTML(followup.contact.name)}</strong> on the ${escapeHTML(followup.job.company)} role is due for a follow-up. ${timing}`,
      id:followup.job.id
    });
  }else{
    cards.push({
      cls:"followup empty",
      title:"No follow-ups due",
      text:"A follow-up will surface one week after your last email or message.",
      id:""
    });
  }

  if(staleEntry){
    cards.push({
      cls:"stale",
      title:"Application getting stale",
      text:`<strong>${escapeHTML(staleEntry.job.company)} · ${escapeHTML(staleEntry.job.role)}</strong> has had no activity for ${staleEntry.days} days.`,
      id:staleEntry.job.id
    });
  }else{
    cards.push({
      cls:"stale empty",
      title:"Nothing stale",
      text:"No saved or active applications have gone a week without activity.",
      id:""
    });
  }

  const grid=document.getElementById("attentionGrid");
  grid.innerHTML=cards.map(card=>`
    <button class="attention ${card.cls}"
      ${card.id ? `data-attention-job="${card.id}"` : ""}
      ${card.openTasks ? 'data-open-tasks="true"' : ""}>
      <h4>${card.title}</h4>
      <p>${card.text}</p>
    </button>
  `).join("");

  grid.querySelectorAll("[data-attention-job]").forEach(btn=>{
    btn.onclick=()=>openJob(btn.dataset.attentionJob);
  });

  grid.querySelectorAll("[data-open-tasks]").forEach(btn=>{
    btn.onclick=()=>go("tasks");
  });
}

function renderHighPriority(){
  const box=document.getElementById("priorityJobs");
  if(!box) return;

  const priority=activeJobs().filter(job=>job.highPriority);

  if(!priority.length){
    box.innerHTML='<div class="priority-empty">No high-priority jobs yet. Mark one as high priority when you add or edit it.</div>';
    return;
  }

  box.innerHTML=priority.map(j=>`
    <div class="jobs-row job priority-job" data-priority-job="${j.id}">
      <div>
        <div class="job-title">${escapeHTML(j.role)}</div>
        <div class="small">★ High priority</div>
      </div>
      <div>
        <div class="job-title">${escapeHTML(j.company)}</div>
        <div class="small">${escapeHTML(j.city)}</div>
      </div>
      <div><span class="status-pill ${statusClass(j.status)}">${escapeHTML(j.status)}</span></div>
      <div><strong>${escapeHTML(displayDeadline(j))}</strong></div>
      <div><strong>${escapeHTML(j.next)}</strong><div class="small">${jobNeedsAttention(j)?"Needs attention":"On track"}</div></div>
    </div>
  `).join("");

  box.querySelectorAll("[data-priority-job]").forEach(row=>{
    row.onclick=()=>openJob(row.dataset.priorityJob);
  });
}

function renderQuickLinks(){
  const box=document.getElementById("quickLinks");
  if(!box) return;

  if(!shortcuts.length){
    box.innerHTML='<div class="quick-links-empty">No quick links yet. Add the sites or documents you use most.</div>';
    return;
  }

  box.innerHTML=shortcuts.map(item=>editingShortcuts
    ? `<div class="quick-link quick-link-edit">
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(item.description || "")}</span>
        </div>
        <button type="button" class="quick-link-remove" data-remove-shortcut="${escapeHTML(item.id)}">Remove</button>
      </div>`
    : `<a class="quick-link" href="${safeURL(item.url) || "#"}" target="_blank" rel="noopener">
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(item.description || "")}</span>
        </div>
        <div class="arrow">↗</div>
      </a>`
  ).join("");

  box.querySelectorAll("[data-remove-shortcut]").forEach(button=>{
    button.addEventListener("click",()=>{
      shortcuts=shortcuts.filter(item=>item.id!==button.dataset.removeShortcut);
      persist();
      renderQuickLinks();
      toast("Quick link removed");
    });
  });
}

function filteredJobs(){
  return activeJobs().filter(j=>{
    const urgentOK=!activeUrgentJobIds || activeUrgentJobIds.has(j.id);

    const statusOK = activeStatusFilter==="All" ||
      (activeStatusFilter==="Attention" ? jobNeedsAttention(j) : j.status===activeStatusFilter);

    const dimensionOK = !activeDimensionFilter ||
      String(j[activeDimensionFilter.key] || "").trim()===activeDimensionFilter.value;

    return urgentOK && statusOK && dimensionOK;
  });
}

function renderFilterChips(){
  const container=document.getElementById("dynamicFilters");
  if(!container) return;

  const cities=distribution("city").map(([name])=>({key:"city",value:name}));
  const industries=distribution("industry").map(([name])=>({key:"industry",value:name}));
  const items=[...cities,...industries];

  container.innerHTML=`
    <button class="chip ${!activeDimensionFilter ? "active" : ""}" data-filter-all="true">All</button>
    ${items.map(item=>`
      <button
        class="chip ${activeDimensionFilter?.key===item.key && activeDimensionFilter?.value===item.value ? "active" : ""}"
        data-filter-key="${escapeHTML(item.key)}"
        data-filter-value="${escapeHTML(item.value)}">
        ${escapeHTML(item.value)}
      </button>
    `).join("")}
  `;

  container.querySelector("[data-filter-all]")?.addEventListener("click",()=>{
    activeUrgentJobIds=null;
    activeDimensionFilter=null;
    renderJobs();
  });

  container.querySelectorAll("[data-filter-key]").forEach(button=>{
    button.addEventListener("click",()=>{
      activeUrgentJobIds=null;
      activeDimensionFilter={
        key:button.dataset.filterKey,
        value:button.dataset.filterValue
      };
      renderJobs();
    });
  });
}

function syncChips(){
  renderFilterChips();
}

function renderFunctionSuggestions(){
  const list=document.getElementById("functionSuggestions");
  if(!list) return;

  const values=[...new Set(
    activeJobs()
      .map(j=>String(j.function || "").trim())
      .filter(Boolean)
  )];

  list.innerHTML=values.map(value=>`<option value="${escapeHTML(value)}"></option>`).join("");
}

function renderJobs(){
  renderFilterChips();
  const list=filteredJobs();
  document.getElementById("visibleCount").textContent=`${list.length} role${list.length===1?"":"s"} shown`;

  const title=activeUrgentJobIds
    ? "Urgent deadlines"
    : activeDimensionFilter
      ? `${activeDimensionFilter.value} jobs`
      : activeStatusFilter==="All"
        ? "All jobs"
        : activeStatusFilter==="Attention"
          ? "Needs attention"
          : `${activeStatusFilter} jobs`;

  document.getElementById("jobsTitle").textContent=title;
  document.getElementById("jobsSubtitle").textContent=activeUrgentJobIds
    ? "Only jobs with tasks or application deadlines due or overdue within the five-day urgent window."
    : activeDimensionFilter
      ? `Showing jobs where ${activeDimensionFilter.key} is ${activeDimensionFilter.value}. Click any role to open its full page.`
      : activeStatusFilter==="Attention"
        ? "Roles with a deadline, follow-up, stale status, or another next action."
        : "Every opportunity in one place. Click any role to open its full page.";

  const table=document.getElementById("jobsTable");

  if(!list.length){
    const isCompletelyEmpty=activeJobs().length===0;
    table.innerHTML=isCompletelyEmpty
      ? `<div class="empty-jobs">
          <div class="eyebrow">Your search starts here</div>
          <h3>Add your first opportunity</h3>
          <p>Paste a job link or add one manually. Once you do, the dashboard, filters, city breakdown, and industry breakdown build themselves around your search.</p>
          <div class="actions">
            <button class="btn" id="emptyPasteJob">Paste job link</button>
            <button class="btn primary" id="emptyAddJob">Add manually</button>
          </div>
        </div>`
      : "<div class='list-item'>No jobs match this view yet.</div>";

    document.getElementById("emptyPasteJob")?.addEventListener("click",()=>document.getElementById("pasteBtn").click());
    document.getElementById("emptyAddJob")?.addEventListener("click",()=>showJobModal());
    return;
  }

  table.innerHTML=`
    <div class="jobs-row header">
      <div>Role</div><div>Company / City</div><div>Status</div><div>Deadline</div><div>Saved</div><div>Next Action</div>
    </div>
    ${list.map(j=>`
      <div class="jobs-row job" data-id="${j.id}">
        <div><div class="job-title">${escapeHTML(j.role)}</div><div class="small">${j.highPriority ? "★ High priority · " : ""}${[j.function,j.industry].filter(Boolean).map(escapeHTML).join(" · ") || "Uncategorized"}</div></div>
        <div><div class="job-title">${escapeHTML(j.company)}</div><div class="small">${escapeHTML(j.city)}</div></div>
        <div><span class="status-pill ${statusClass(j.status)}">${escapeHTML(j.status)}</span></div>
        <div><strong>${escapeHTML(displayDeadline(j))}</strong></div>
        <div><strong>${escapeHTML(savedLabel(j))}</strong></div>
        <div><strong>${escapeHTML(j.next)}</strong><div class="small">${jobNeedsAttention(j)?"Needs attention":"On track"}</div></div>
      </div>
    `).join("")}
  `;

  table.querySelectorAll(".jobs-row.job").forEach(r=>r.onclick=()=>openJob(r.dataset.id));
}

function formatContact(contact){
  const bits=[];
  if(contact.role) bits.push(contact.role);
  if(contact.last) bits.push(`last contacted ${contact.last}`);
  if(contact.followUp) bits.push(`follow up ${contact.followUp}`);
  return bits.join(" · ") || "No notes yet";
}

function formatTimelineDate(date){
  if(!date) return "";
  const d=new Date(date+"T00:00:00");
  if(Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

function openJob(id,returnPage="jobs"){
  const j=jobs.find(x=>x.id===id);
  if(!j) return;

  activeJobId=id;
  detailReturnPage=returnPage;
  const backButton=document.getElementById("backToJobs");
  if(backButton){
    backButton.textContent=returnPage==="tasks" ? "← Back to tasks" : "← Back to jobs";
  }

  document.getElementById("detailStatus").className=`status-pill ${statusClass(j.status)}`;
  document.getElementById("detailStatus").textContent=j.status;
  document.getElementById("detailStatusSelect").value=j.status;
  document.getElementById("detailPriority").hidden=!j.highPriority;
  document.getElementById("detailRole").textContent=j.role;
  document.getElementById("detailCompany").textContent=[j.company,j.city,j.function,j.industry].filter(Boolean).join(" · ");
  document.getElementById("detailSaved").textContent=savedLabel(j);
  document.getElementById("detailDeadline").textContent=displayDeadline(j);
  document.getElementById("detailSource").textContent=j.source;
  document.getElementById("detailComp").textContent=j.comp;
  document.getElementById("detailNotes").value=j.notes || "";

  document.getElementById("detailNext").innerHTML=`
    <div class="list-item">
      <strong>${escapeHTML(j.next)}</strong>
      ${escapeHTML(j.nextDetail)}
      ${j.nextDue ? `<div class="next-action-due">Due ${escapeHTML(formatTimelineDate(j.nextDue))}</div>` : ""}
    </div>
  `;

  document.getElementById("detailContacts").innerHTML=j.contacts.length
    ? j.contacts.map((contact,index)=>{
        const url=safeURL(contact.link);
        return `<div class="list-item">
          <strong>${escapeHTML(contact.name)}</strong>
          ${escapeHTML(formatContact(contact))}
          <div class="contact-actions">
            ${url ? `<a class="text-button" href="${url}" target="_blank" rel="noopener">Open contact ↗</a>` : ""}
            <button class="text-button" data-delete-contact="${index}">Remove</button>
          </div>
        </div>`;
      }).join("")
    : "<div class='list-item'>No contacts yet. Add someone you may want to reach out to.</div>";

  document.querySelectorAll("[data-delete-contact]").forEach(btn=>{
    btn.onclick=()=>{
      const idx=Number(btn.dataset.deleteContact);
      const removed=j.contacts[idx];
      j.contacts.splice(idx,1);
      j.timeline.unshift(normalizeTimelineEntry({
        title:"Contact removed",
        detail:removed?.name || "Contact",
        date:localDateISO(),
        type:"Networking"
      }));
      persist();
      updateAll();
      openJob(j.id);
      toast("Contact removed");
    };
  });

  document.getElementById("detailTimeline").innerHTML=j.timeline.length
    ? j.timeline.map(t=>`
      <div class="list-item">
        <strong>${escapeHTML(t.title)}</strong>
        ${escapeHTML(t.detail)}
        <div class="timeline-meta">
          ${t.type ? escapeHTML(t.type) : "Activity"}${t.date ? ` · ${escapeHTML(formatTimelineDate(t.date))}` : ""}
        </div>
      </div>
    `).join("")
    : "<div class='list-item'>No timeline activity yet.</div>";

  setLinkCard("detailJobLink","detailJobLinkText",j.jobUrl,"Open original posting ↗","No job link added");
  setLinkCard("detailResumeLink","detailResumeLinkText",j.resumeUrl,"Open resume / document ↗","No resume link added");

  go("detail");
}

function setLinkCard(cardId,textId,url,activeText,inactiveText){
  const card=document.getElementById(cardId);
  const text=document.getElementById(textId);
  const safe=safeURL(url);

  if(safe){
    card.href=safe;
    card.classList.remove("disabled");
    text.textContent=activeText;
  }else{
    card.href="#";
    card.classList.add("disabled");
    text.textContent=inactiveText;
  }
}

document.querySelectorAll(".metric").forEach(m=>m.onclick=()=>{
  activeUrgentJobIds=null;
  activeStatusFilter=m.dataset.filter;
  activeDimensionFilter=null;
  syncChips();
  renderJobs();
  go("jobs");
});

document.getElementById("clearFilter").onclick=()=>{
  activeUrgentJobIds=null;
  activeStatusFilter="All";
  activeDimensionFilter=null;
  syncChips();
  renderJobs();
};

document.getElementById("backToJobs").onclick=()=>{
  if(detailReturnPage==="tasks"){
    go("tasks");
  }else{
    renderJobs();
    go("jobs");
  }
};

document.getElementById("backToDashboardFromTasks").onclick=()=>go("dashboard");

document.getElementById("detailStatusSelect").onchange=e=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  const old=j.status;
  j.status=e.target.value;
  j.attention=["Saved","Applying","Interviewing","Offer"].includes(j.status);
  j.timeline.unshift(normalizeTimelineEntry({
    title:"Status updated",
    detail:`${old} → ${j.status}`,
    date:localDateISO(),
    type:"Application"
  }));
  persist();
  updateAll();
  openJob(j.id);
  toast("Status updated");
};

document.getElementById("saveNotesBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  j.notes=document.getElementById("detailNotes").value;
  persist();
  toast("Notes saved");
};

document.getElementById("archiveJobBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  j.archived=true;
  j.attention=false;
  persist();
  updateAll();
  go("jobs");
  toast("Job archived");
};

const deleteModalBackdrop=document.getElementById("deleteModalBackdrop");

document.getElementById("deleteJobBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  document.getElementById("deleteConfirmText").textContent=
    `Delete ${j.company} · ${j.role}? This will permanently remove its notes, contacts, and timeline.`;

  deleteModalBackdrop.classList.add("show");
};

document.getElementById("cancelDeleteJob").onclick=()=>{
  deleteModalBackdrop.classList.remove("show");
};

document.getElementById("confirmDeleteJob").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  jobs=jobs.filter(x=>x.id!==activeJobId);
  activeJobId=null;
  persist();
  deleteModalBackdrop.classList.remove("show");
  updateAll();
  go("jobs");
  toast("Job deleted");
};

deleteModalBackdrop.addEventListener("click",event=>{
  if(event.target===deleteModalBackdrop){
    deleteModalBackdrop.classList.remove("show");
  }
});


const onboardingBackdrop=document.getElementById("onboardingBackdrop");

function completeOnboarding(){
  localStorage.setItem(ONBOARDING_KEY,"done");
  onboardingBackdrop.classList.remove("show");
}

function maybeShowOnboarding(){
  const hasSeenOnboarding=localStorage.getItem(ONBOARDING_KEY)==="done";
  const hasJobs=jobs.length>0;
  if(!hasSeenOnboarding && !hasJobs){
    onboardingBackdrop.classList.add("show");
  }
}

document.getElementById("onboardPasteBtn").onclick=()=>{
  const url=document.getElementById("onboardJobUrl").value.trim();
  if(!url){
    document.getElementById("onboardJobUrl").focus();
    return;
  }
  completeOnboarding();
  startJobFromUrl(url);
};

document.getElementById("onboardManualBtn").onclick=()=>{
  completeOnboarding();
  showJobModal();
};

document.getElementById("onboardSkipBtn").onclick=()=>{
  completeOnboarding();
  go("dashboard");
};

const jobBackdrop=document.getElementById("jobModalBackdrop");

function showJobModal(job=null,initialUrl=""){
  editingJobId=job?.id || null;
  document.getElementById("jobModalTitle").textContent=job ? "Edit job" : "Add a job";
  document.getElementById("fCompany").value=job?.company || "";
  document.getElementById("fRole").value=job?.role || "";
  document.getElementById("fCity").value=job?.city || "";
  document.getElementById("fIndustry").value=job?.industry || "";
  renderFunctionSuggestions();
  document.getElementById("fFunction").value=job?.function || "";
  document.getElementById("fStatus").value=job?.status || "Saved";
  document.getElementById("fDeadline").value=job?.deadlineDate || (job ? inferDeadlineDate(job.deadline,job.createdAt) : "");
  document.getElementById("fHighPriority").checked=Boolean(job?.highPriority);
  document.getElementById("fComp").value=job?.comp || "";
  document.getElementById("fSource").value=job?.source || inferSource(initialUrl);
  document.getElementById("fNext").value=job?.next || "";
  document.getElementById("fNextDetail").value=job?.nextDetail || "";
  document.getElementById("fNextDue").value=job?.nextDue || "";
  document.getElementById("fJobUrl").value=job?.jobUrl || initialUrl || "";
  document.getElementById("fResumeUrl").value=job?.resumeUrl || "";
  jobBackdrop.classList.add("show");
}

function hideJobModal(){
  jobBackdrop.classList.remove("show");
  editingJobId=null;
}

function normalizeJobUrl(raw){
  const value=String(raw||"").trim();
  if(!value) return "";
  try{
    return new URL(value).href;
  }catch{
    try{
      return new URL("https://"+value).href;
    }catch{
      return "";
    }
  }
}

function titleCaseWords(value){
  return String(value||"")
    .replace(/[-_]+/g," ")
    .replace(/\b\w/g,ch=>ch.toUpperCase())
    .replace(/\s+/g," ")
    .trim();
}

function inferSource(url){
  try{
    const host=new URL(url).hostname.toLowerCase();
    if(host.includes("linkedin")) return "LinkedIn";
    if(host.includes("joinhandshake") || host.includes("handshake")) return "Handshake";
    if(host.includes("indeed")) return "Indeed";
    if(host.includes("greenhouse")) return "Greenhouse";
    if(host.includes("lever.co")) return "Lever";
    if(host.includes("ashbyhq")) return "Ashby";
    if(host.includes("myworkdayjobs")) return "Workday";
    if(host.includes("smartrecruiters")) return "SmartRecruiters";
    return "Company site";
  }catch{
    return "";
  }
}

function inferCompanyFromUrl(url){
  try{
    const u=new URL(url);
    const host=u.hostname.toLowerCase();
    const parts=u.pathname.split("/").filter(Boolean);

    if(host.includes("lever.co") && parts[0]) return titleCaseWords(parts[0]);
    if(host.includes("ashbyhq.com") && parts[0]) return titleCaseWords(parts[0]);
    if(host.includes("greenhouse.io") && parts[0] && !["jobs","embed"].includes(parts[0].toLowerCase())) return titleCaseWords(parts[0]);
    if(host.includes("smartrecruiters.com") && parts[0]) return titleCaseWords(parts[0]);

    if(host.includes("myworkdayjobs.com")){
      const first=host.split(".")[0];
      const cleaned=first.replace(/wd\d+$/,"").replace(/careers?$/,"");
      if(cleaned) return titleCaseWords(cleaned);
    }

    if(host.includes("linkedin.com")){
      const match=u.pathname.match(/\/jobs\/view\/([^/?#]+)/i);
      if(match){
        const slug=decodeURIComponent(match[1]).replace(/-\d+$/,"");
        const atIndex=slug.lastIndexOf("-at-");
        if(atIndex>0) return titleCaseWords(slug.slice(atIndex+4));
      }
      return "";
    }

    const labels=host.split(".").filter(Boolean);
    const ignored=new Set(["www","jobs","job","careers","career","apply","boards","board"]);
    const candidate=labels.find(x=>!ignored.has(x) && !["com","org","net","io","co","ai"].includes(x));
    return candidate ? titleCaseWords(candidate) : "";
  }catch{
    return "";
  }
}

function inferRoleFromUrl(url){
  try{
    const u=new URL(url);
    const host=u.hostname.toLowerCase();
    const parts=u.pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if(host.includes("linkedin.com")){
      const match=u.pathname.match(/\/jobs\/view\/([^/?#]+)/i);
      if(match){
        let slug=decodeURIComponent(match[1]).replace(/-\d+$/,"");
        const atIndex=slug.lastIndexOf("-at-");
        if(atIndex>0) slug=slug.slice(0,atIndex);
        return titleCaseWords(slug);
      }
    }

    // Use a descriptive slug when it is clearly more than a numeric job id.
    const candidate=[...parts].reverse().find(part=>{
      const cleaned=part.replace(/\.html?$/i,"");
      return cleaned.length>6 && !/^\d+$/.test(cleaned) && /[-_]/.test(cleaned);
    });

    if(candidate){
      return titleCaseWords(candidate.replace(/\.html?$/i,"").replace(/^job[-_]?/i,""));
    }
  }catch{}
  return "";
}

function inferFunctionFromRole(role){
  const r=String(role||"").toLowerCase();
  if(/product manager|product management|product operations|product strategy|product marketing/.test(r)) return "Product";
  if(/investment|research analyst|finance|financial|equity|credit|asset management/.test(r)) return "Finance";
  if(/software|engineer|developer|data scientist|machine learning|technical/.test(r)) return "Tech";
  if(/consult|strategy consultant/.test(r)) return "Consulting";
  if(/operations|strategy & operations|business operations/.test(r)) return "Operations";
  return "Other";
}

function flattenJobPosting(value){
  if(!value) return null;
  if(Array.isArray(value)){
    for(const item of value){
      const found=flattenJobPosting(item);
      if(found) return found;
    }
    return null;
  }
  if(typeof value==="object"){
    const type=value["@type"];
    if(type==="JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return value;
    if(value["@graph"]){
      const found=flattenJobPosting(value["@graph"]);
      if(found) return found;
    }
  }
  return null;
}

function locationFromPosting(posting){
  const loc=Array.isArray(posting?.jobLocation) ? posting.jobLocation[0] : posting?.jobLocation;
  const address=loc?.address || loc;
  const pieces=[address?.addressLocality,address?.addressRegion].filter(Boolean);
  return pieces.join(", ");
}

function compensationFromPosting(posting){
  const base=posting?.baseSalary;
  if(!base) return "";
  if(typeof base==="string") return base;

  const currency=base.currency || "";
  const val=base.value || base;
  const unit=val.unitText ? `/${String(val.unitText).toLowerCase()}` : "";
  const min=val.minValue;
  const max=val.maxValue;
  const single=val.value;

  const fmt=n=>Number(n).toLocaleString("en-US",{maximumFractionDigits:0});
  if(min!=null && max!=null) return `${currency} ${fmt(min)}–${fmt(max)}${unit}`.trim();
  if(single!=null) return `${currency} ${fmt(single)}${unit}`.trim();
  return "";
}

function deadlineFromPosting(posting){
  const raw=posting?.validThrough;
  if(!raw) return "";
  const d=new Date(raw);
  if(Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

async function tryReadJobPosting(url){
  try{
    const response=await fetch(url,{mode:"cors",credentials:"omit"});
    if(!response.ok) return null;

    const html=await response.text();
    const doc=new DOMParser().parseFromString(html,"text/html");
    let posting=null;

    for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
      try{
        const json=JSON.parse(script.textContent);
        posting=flattenJobPosting(json);
        if(posting) break;
      }catch{}
    }

    const metaTitle=
      doc.querySelector('meta[property="og:title"]')?.content ||
      doc.querySelector('meta[name="twitter:title"]')?.content ||
      doc.title ||
      "";

    return {
      company: posting?.hiringOrganization?.name || "",
      role: posting?.title || metaTitle.replace(/\s+[|–-]\s+.*$/,"").trim(),
      city: locationFromPosting(posting),
      industry: typeof posting?.industry==="string" ? posting.industry : "",
      comp: compensationFromPosting(posting),
      deadline: deadlineFromPosting(posting),
      source: inferSource(url)
    };
  }catch{
    return null;
  }
}

function applyPrefill(data){
  if(!data) return;

  const mapping={
    company:"fCompany",
    role:"fRole",
    city:"fCity",
    industry:"fIndustry",
    comp:"fComp",
    deadline:"fDeadline",
    source:"fSource"
  };

  Object.entries(mapping).forEach(([key,id])=>{
    if(data[key] && !document.getElementById(id).value.trim()){
      document.getElementById(id).value=data[key];
    }
  });

  const role=document.getElementById("fRole").value.trim();
  if(role){
    document.getElementById("fFunction").value=inferFunctionFromRole(role);
  }
}

async function startJobFromUrl(rawUrl){
  const url=normalizeJobUrl(rawUrl);
  if(!url){
    alert("That does not look like a valid job link.");
    return;
  }

  const heuristic={
    company:inferCompanyFromUrl(url),
    role:inferRoleFromUrl(url),
    source:inferSource(url)
  };

  showJobModal(null,url);
  applyPrefill(heuristic);

  const title=document.getElementById("jobModalTitle");
  const originalTitle=title.textContent;
  title.textContent="Reading job posting…";

  const fetched=await tryReadJobPosting(url);
  applyPrefill(fetched);

  title.textContent=originalTitle;

  const filled=["fCompany","fRole","fCity","fIndustry","fComp","fDeadline"]
    .filter(id=>document.getElementById(id).value.trim()).length;

  toast(filled>2
    ? "Filled in what I could find — review before saving"
    : "I pulled what I could from the link — fill in the rest"
  );
}

document.getElementById("addBtn").onclick=()=>showJobModal();
document.getElementById("addBtn2").onclick=()=>showJobModal();
document.getElementById("editJobBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(j) showJobModal(j);
};
document.getElementById("cancelJobModal").onclick=hideJobModal;

const pasteJobModalBackdrop=document.getElementById("pasteJobModalBackdrop");
const pasteJobUrlInput=document.getElementById("pasteJobUrlInput");

function openPasteJobModal(){
  pasteJobUrlInput.value="";
  pasteJobModalBackdrop.classList.add("show");
  requestAnimationFrame(()=>pasteJobUrlInput.focus());
}

function closePasteJobModal(){
  pasteJobModalBackdrop.classList.remove("show");
}

function submitPastedJob(){
  const url=pasteJobUrlInput.value.trim();
  if(!url){
    pasteJobUrlInput.focus();
    return;
  }
  closePasteJobModal();
  startJobFromUrl(url);
}

document.getElementById("pasteBtn").onclick=openPasteJobModal;
document.getElementById("cancelPasteJob").onclick=closePasteJobModal;
document.getElementById("continuePasteJob").onclick=submitPastedJob;

pasteJobUrlInput.addEventListener("keydown",event=>{
  if(event.key==="Enter"){
    event.preventDefault();
    submitPastedJob();
  }
});

pasteJobModalBackdrop.addEventListener("click",event=>{
  if(event.target===pasteJobModalBackdrop) closePasteJobModal();
});

document.getElementById("saveJob").onclick=()=>{
  const company=document.getElementById("fCompany").value.trim();
  const role=document.getElementById("fRole").value.trim();

  if(!company || !role){
    alert("Add a company and role first.");
    return;
  }

  if(editingJobId){
    const j=jobs.find(x=>x.id===editingJobId);
    if(!j) return;

    Object.assign(j,{
      company,
      role,
      city:document.getElementById("fCity").value.trim(),
      industry:document.getElementById("fIndustry").value.trim(),
      function:document.getElementById("fFunction").value.trim(),
      status:document.getElementById("fStatus").value,
      deadlineDate:document.getElementById("fDeadline").value,
      deadline:document.getElementById("fDeadline").value || "No deadline",
      highPriority:document.getElementById("fHighPriority").checked,
      comp:document.getElementById("fComp").value.trim() || "Not added",
      source:document.getElementById("fSource").value.trim() || "Manual",
      next:document.getElementById("fNext").value.trim() || "Review role",
      nextDetail:document.getElementById("fNextDetail").value.trim() || "Add the next step you want to take.",
      nextDue:document.getElementById("fNextDue").value,
      jobUrl:document.getElementById("fJobUrl").value.trim(),
      resumeUrl:document.getElementById("fResumeUrl").value.trim()
    });

    j.attention=["Saved","Applying","Interviewing","Offer"].includes(j.status);
    j.timeline.unshift(normalizeTimelineEntry({
      title:"Job updated",
      detail:"Role details edited.",
      date:localDateISO(),
      type:"Custom"
    }));
    persist();
    hideJobModal();
    safeRender("jobs refresh failed",renderJobs);
    safeRender("dashboard refresh failed",refreshDashboard);
    openJob(j.id);
    toast("Job updated");
    return;
  }

  const j=normalizeJob({
    id:"job"+Date.now(),
    company,
    role,
    city:document.getElementById("fCity").value.trim(),
    industry:document.getElementById("fIndustry").value.trim(),
    function:document.getElementById("fFunction").value.trim(),
    status:document.getElementById("fStatus").value,
    saved:"Just now",
    createdAt:localDateISO(),
    deadlineDate:document.getElementById("fDeadline").value,
    deadline:document.getElementById("fDeadline").value || "No deadline",
    highPriority:document.getElementById("fHighPriority").checked,
    source:document.getElementById("fSource").value.trim() || "Manual",
    comp:document.getElementById("fComp").value.trim() || "Not added",
    attention:["Saved","Applying","Interviewing","Offer"].includes(document.getElementById("fStatus").value),
    next:document.getElementById("fNext").value.trim() || "Review role",
    nextDetail:document.getElementById("fNextDetail").value.trim() || "Open the role and add whatever context you need.",
    nextDue:document.getElementById("fNextDue").value,
    jobUrl:document.getElementById("fJobUrl").value.trim(),
    resumeUrl:document.getElementById("fResumeUrl").value.trim(),
    contacts:[],
    timeline:[{
      title:"Saved role",
      detail:"Added to dashboard just now.",
      date:localDateISO(),
      type:"Application"
    }]
  });

  jobs.unshift(j);
  localStorage.setItem(ONBOARDING_KEY,"done");
  persist();
  hideJobModal();

  // Update all job-based views in memory immediately, but never block navigation
  // if an unrelated dashboard widget has a rendering problem.
  safeRender("jobs refresh failed",renderJobs);
  safeRender("offers refresh failed",renderOffers);
  safeRender("dashboard refresh failed",refreshDashboard);

  openJob(j.id);
  toast("Job added");
};

const contactBackdrop=document.getElementById("contactModalBackdrop");

document.getElementById("addContactBtn").onclick=()=>{
  if(!activeJobId) return;
  ["cName","cRole","cLink","cLast","cFollow"].forEach(id=>document.getElementById(id).value="");
  contactBackdrop.classList.add("show");
};

document.getElementById("cancelContactModal").onclick=()=>contactBackdrop.classList.remove("show");

document.getElementById("saveContact").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  const name=document.getElementById("cName").value.trim();
  if(!name){
    alert("Add a contact name first.");
    return;
  }

  j.contacts.push({
    name,
    role:document.getElementById("cRole").value.trim(),
    link:document.getElementById("cLink").value.trim(),
    last:document.getElementById("cLast").value,
    followUp:document.getElementById("cFollow").value
  });

  j.timeline.unshift(normalizeTimelineEntry({
    title:"Contact added",
    detail:name,
    date:localDateISO(),
    type:"Networking"
  }));
  if(document.getElementById("cFollow").value) j.attention=true;

  persist();
  contactBackdrop.classList.remove("show");
  updateAll();
  openJob(j.id);
  toast("Contact added");
};

const timelineBackdrop=document.getElementById("timelineModalBackdrop");
let timelineMode="activity";

function showTimelineModal(mode="activity"){
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  timelineMode=mode;
  document.getElementById("timelineModalTitle").textContent=mode==="next" ? "Update next action" : "Add activity";
  document.getElementById("tType").value=mode==="next" ? "Custom" : "Application";
  document.getElementById("tDate").value=localDateISO();
  document.getElementById("tTitle").value=mode==="next" ? j.next : "";
  document.getElementById("tDetail").value=mode==="next" ? j.nextDetail : "";
  document.getElementById("tSetNext").checked=mode==="next";
  document.getElementById("tNextDue").value=mode==="next" ? (j.nextDue || "") : "";
  document.getElementById("saveTimeline").textContent=mode==="next" ? "Save next action" : "Add to timeline";
  timelineBackdrop.classList.add("show");
}

document.getElementById("addTimelineBtn").onclick=()=>showTimelineModal("activity");
document.getElementById("editNextActionBtn").onclick=()=>showTimelineModal("next");
document.getElementById("cancelTimelineModal").onclick=()=>timelineBackdrop.classList.remove("show");

document.getElementById("saveTimeline").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  const title=document.getElementById("tTitle").value.trim();
  const detail=document.getElementById("tDetail").value.trim();
  const date=document.getElementById("tDate").value;
  const type=document.getElementById("tType").value;
  const setNext=document.getElementById("tSetNext").checked || timelineMode==="next";

  if(!title){
    alert("Add a title first.");
    return;
  }

  j.timeline.unshift(normalizeTimelineEntry({
    title,
    detail,
    date,
    type
  }));

  if(setNext){
    j.next=title;
    j.nextDetail=detail || "Next step added from the timeline.";
    j.nextDue=document.getElementById("tNextDue").value;
    j.attention=true;
  }

  persist();
  timelineBackdrop.classList.remove("show");
  updateAll();
  openJob(j.id);
  toast(setNext ? "Timeline and next action updated" : "Timeline updated");
};

document.getElementById("apolloConnectionsBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  window.open("https://app.apollo.io/#/people","_blank","noopener");
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(j.company)
      .then(()=>toast(`${j.company} copied for Apollo search`))
      .catch(()=>toast("Apollo opened"));
  }else{
    toast("Apollo opened");
  }
};

function copyTextRobust(text){
  if(navigator.clipboard?.writeText){
    return navigator.clipboard.writeText(text).catch(()=>legacyCopyText(text));
  }
  return legacyCopyText(text);
}

function legacyCopyText(text){
  return new Promise((resolve,reject)=>{
    const ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.opacity="0";
    ta.style.pointerEvents="none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0,ta.value.length);

    try{
      const ok=document.execCommand("copy");
      ta.remove();
      ok ? resolve() : reject(new Error("Copy command failed"));
    }catch(err){
      ta.remove();
      reject(err);
    }
  });
}

document.getElementById("chatgptConnectionsBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  const promptText=`I am considering/applying to the ${j.role} role at ${j.company} in ${j.city}. Help me identify relevant people I could reach out to about this role. Prioritize people likely connected to the team or hiring process, product/business leaders relevant to the role, early-talent or recruiting contacts, and people with plausible shared background. For each person, give me their current title, why they are relevant, and a public profile/link when available. Do not guess private contact information or invent people. Also suggest the 3 best people to contact first and why.`;

  const chatUrl="https://chatgpt.com/?q="+encodeURIComponent(promptText);
  window.open(chatUrl,"_blank","noopener");
};

document.getElementById("editShortcutsBtn").onclick=()=>{
  editingShortcuts=!editingShortcuts;
  document.getElementById("editShortcutsBtn").textContent=editingShortcuts ? "Done" : "Edit";
  renderQuickLinks();
};

const shortcutBackdrop=document.getElementById("shortcutModalBackdrop");

document.getElementById("addShortcutBtn").onclick=()=>{
  ["sName","sDescription","sUrl"].forEach(id=>document.getElementById(id).value="");
  shortcutBackdrop.classList.add("show");
};

document.getElementById("cancelShortcutModal").onclick=()=>shortcutBackdrop.classList.remove("show");

document.getElementById("saveShortcut").onclick=()=>{
  const name=document.getElementById("sName").value.trim();
  const url=safeURL(document.getElementById("sUrl").value);

  if(!name || !url){
    alert("Add a name and a valid http/https link.");
    return;
  }

  shortcuts.push({
    id:"shortcut"+Date.now(),
    name,
    description:document.getElementById("sDescription").value.trim(),
    url,
    fixed:false
  });

  persist();
  renderQuickLinks();
  shortcutBackdrop.classList.remove("show");
  toast("Quick link added");
};

function money(value){
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(value)||0);
}

function computeOffer(o){
  const monthlyTakeHome=(Number(o.base)||0)*(1-(Number(o.tax)||0)/100)/12;
  const afterFixed=monthlyTakeHome-(Number(o.rent)||0)-(Number(o.fixed)||0);
  const firstYear=(Number(o.base)||0)+(Number(o.bonus)||0);
  return {...o,monthlyTakeHome,afterFixed,firstYear};
}

function renderOffers(){
  const grid=document.getElementById("offerGrid");

  if(!offers.length){
    grid.innerHTML="<div class='list-item'>No offers added yet. Add one when you have something to compare.</div>";
    document.getElementById("compareNote").textContent="Add at least two offers to see a comparison.";
    return;
  }

  const computed=offers.map(computeOffer);

  grid.innerHTML=computed.map((o,i)=>`
    <div class="offer">
      <button class="offer-remove" data-remove-offer="${o.id}" aria-label="Remove offer">×</button>
      <h3>${escapeHTML(o.company || `Offer ${i+1}`)}</h3>
      <p>${escapeHTML(o.role)} · ${escapeHTML(o.city)}</p>
      <div class="offer-stats">
        <div class="offer-stat"><small>Base salary</small><strong>${money(o.base)}</strong></div>
        <div class="offer-stat"><small>Sign-on / bonus</small><strong>${money(o.bonus)}</strong></div>
        <div class="offer-stat"><small>Est. monthly take-home</small><strong>${money(o.monthlyTakeHome)}</strong></div>
        <div class="offer-stat"><small>Rent assumption</small><strong>${money(o.rent)}</strong></div>
        <div class="offer-stat"><small>After fixed costs</small><strong>${money(o.afterFixed)}/mo</strong></div>
        <div class="offer-stat"><small>First-year cash comp</small><strong>${money(o.firstYear)}</strong></div>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-remove-offer]").forEach(btn=>{
    btn.onclick=()=>{
      offers=offers.filter(o=>o.id!==btn.dataset.removeOffer);
      persist();
      renderOffers();
    };
  });

  if(computed.length<2){
    document.getElementById("compareNote").textContent="Add another offer to compare the economics side by side.";
    return;
  }

  const bestCash=[...computed].sort((a,b)=>b.firstYear-a.firstYear)[0];
  const bestMonthly=[...computed].sort((a,b)=>b.afterFixed-a.afterFixed)[0];

  document.getElementById("compareNote").innerHTML=
    `<strong>On your assumptions:</strong> ${escapeHTML(bestCash.company)} has the highest first-year cash compensation at <strong>${money(bestCash.firstYear)}</strong>, while ${escapeHTML(bestMonthly.company)} leaves the most after monthly fixed costs at about <strong>${money(bestMonthly.afterFixed)}/month</strong>. This is an illustration based on the tax and cost assumptions you entered, not a recommendation.`;
}

const offerBackdrop=document.getElementById("offerModalBackdrop");

document.getElementById("addOfferBtn").onclick=()=>{
  ["oCompany","oRole","oCity","oBase","oBonus","oTax","oRent","oFixed"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("oTax").value="35";
  offerBackdrop.classList.add("show");
};

document.getElementById("cancelOfferModal").onclick=()=>offerBackdrop.classList.remove("show");

document.getElementById("saveOffer").onclick=()=>{
  const company=document.getElementById("oCompany").value.trim();
  const role=document.getElementById("oRole").value.trim();

  if(!company || !role){
    alert("Add a company and role first.");
    return;
  }

  offers.push({
    id:"offer"+Date.now(),
    company,
    role,
    city:document.getElementById("oCity").value.trim(),
    base:Number(document.getElementById("oBase").value)||0,
    bonus:Number(document.getElementById("oBonus").value)||0,
    tax:Number(document.getElementById("oTax").value)||0,
    rent:Number(document.getElementById("oRent").value)||0,
    fixed:Number(document.getElementById("oFixed").value)||0
  });

  persist();
  offerBackdrop.classList.remove("show");
  renderOffers();
  toast("Offer added");
};

document.getElementById("loadSampleOffers").onclick=()=>{
  offers=clone(SAMPLE_OFFERS);
  persist();
  renderOffers();
  toast("Sample offers loaded");
};

function refreshDashboard(){
  safeRender("dashboard counts failed",updateCounts);
  safeRender("attention cards failed",renderAttention);
  safeRender("city chart failed",()=>renderDonut("city","cityDonut","cityLegend","cityTotal"));
  safeRender("industry chart failed",()=>renderDonut("industry","industryDonut","industryLegend","industryTotal"));
  safeRender("quick links failed",renderQuickLinks);
  safeRender("high priority failed",renderHighPriority);
  safeRender("function suggestions failed",renderFunctionSuggestions);
}

function updateAll(){
  safeRender("dashboard refresh failed",refreshDashboard);
  safeRender("jobs refresh failed",renderJobs);
  safeRender("offers refresh failed",renderOffers);
}

function authRedirectUrl(){
  return window.location.origin + window.location.pathname;
}

async function resendConfirmation(email){
  const cleanEmail=(email || document.getElementById("authEmail").value).trim();
  const message=document.getElementById("authMessage");
  if(!cleanEmail){
    message.textContent="Enter your email first.";
    return;
  }

  message.textContent="Sending a fresh confirmation email…";
  const {error}=await supabaseClient.auth.resend({
    type:"signup",
    email:cleanEmail,
    options:{emailRedirectTo:authRedirectUrl()}
  });

  if(error){
    message.textContent=error.message || "Could not resend the confirmation email.";
    return;
  }

  localStorage.setItem(PENDING_EMAIL_KEY,cleanEmail);
  message.innerHTML='Fresh confirmation email sent. Use the newest email only. <button type="button" class="auth-inline-btn" id="resendConfirmBtn">Resend again</button>';
  document.getElementById("resendConfirmBtn").onclick=()=>resendConfirmation(cleanEmail);
}

function showConfirmationNeeded(email,expired=false){
  const message=document.getElementById("authMessage");
  const cleanEmail=(email || localStorage.getItem(PENDING_EMAIL_KEY) || "").trim();
  if(cleanEmail) document.getElementById("authEmail").value=cleanEmail;
  const intro=expired
    ? "That confirmation link expired. Send yourself a fresh one and use the newest email."
    : "Confirm your email before signing in.";
  message.innerHTML=intro + ' <button type="button" class="auth-inline-btn" id="resendConfirmBtn">Resend confirmation</button>';
  document.getElementById("resendConfirmBtn").onclick=()=>resendConfirmation(cleanEmail);
}

function setAuthMode(mode){
  authMode=mode;
  document.querySelectorAll("[data-auth-mode]").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.authMode===mode);
  });
  document.getElementById("authSubmit").textContent=mode==="signup" ? "Create account" : "Sign in";
  document.getElementById("authPassword").autocomplete=mode==="signup" ? "new-password" : "current-password";
  document.getElementById("authMessage").textContent="";
}

function showGuest(){
  currentUser=null;
  cloudReady=false;
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("auth-hidden");
  document.getElementById("accountEmail").textContent="Guest mode · saved on this device";
  document.getElementById("accountBtn").hidden=false;
  document.getElementById("signOutBtn").hidden=true;
  updateAll();
  maybeShowOnboarding();
}

function openAuth(){
  document.getElementById("authScreen").classList.remove("hidden");
  setAuthMode("signup");
}

function closeAuth(){
  document.getElementById("authScreen").classList.add("hidden");
}

async function showSignedIn(user){
  currentUser=user;
  document.getElementById("accountEmail").textContent=user.email || "Signed in";
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("auth-hidden");
  document.getElementById("accountBtn").hidden=true;
  document.getElementById("signOutBtn").hidden=false;

  try{
    await loadCloudState(user);
  }catch{
    toast("Using this device's saved data for now");
    cloudReady=true;
  }

  updateAll();
  maybeShowOnboarding();
}

document.querySelectorAll("[data-auth-mode]").forEach(btn=>{
  btn.addEventListener("click",()=>setAuthMode(btn.dataset.authMode));
});

document.getElementById("accountBtn").addEventListener("click",openAuth);
document.getElementById("authCloseBtn").addEventListener("click",closeAuth);

document.getElementById("authScreen").addEventListener("click",event=>{
  if(event.target===document.getElementById("authScreen")) closeAuth();
});

document.getElementById("authForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPassword").value;
  const message=document.getElementById("authMessage");
  const submit=document.getElementById("authSubmit");

  message.textContent="";
  submit.disabled=true;
  submit.textContent=authMode==="signup" ? "Creating account…" : "Signing in…";

  try{
    if(authMode==="signup"){
      const {data,error}=await supabaseClient.auth.signUp({
        email,
        password,
        options:{emailRedirectTo:authRedirectUrl()}
      });
      if(error) throw error;

      if(data.session){
        localStorage.removeItem(PENDING_EMAIL_KEY);
        await showSignedIn(data.user);
      }else{
        localStorage.setItem(PENDING_EMAIL_KEY,email);
        setAuthMode("signin");
        document.getElementById("authEmail").value=email;
        message.innerHTML='Account created. Check your inbox and click the confirmation link. <button type="button" class="auth-inline-btn" id="resendConfirmBtn">Resend confirmation</button>';
        document.getElementById("resendConfirmBtn").onclick=()=>resendConfirmation(email);
      }
    }else{
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error) throw error;
      localStorage.removeItem(PENDING_EMAIL_KEY);
      await showSignedIn(data.user);
    }
  }catch(error){
    if(error?.code==="email_not_confirmed" || /email not confirmed/i.test(error?.message || "")){
      localStorage.setItem(PENDING_EMAIL_KEY,email);
      showConfirmationNeeded(email,false);
    }else{
      message.textContent=error?.message || "Something went wrong. Try again.";
    }
  }finally{
    submit.disabled=false;
    submit.textContent=authMode==="signup" ? "Create account" : "Sign in";
  }
});

document.getElementById("signOutBtn").addEventListener("click",async()=>{
  await saveCloudState();
  await supabaseClient.auth.signOut();

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SHORTCUTS_KEY);
  localStorage.removeItem(OFFERS_KEY);
  localStorage.removeItem(ONBOARDING_KEY);

  jobs=clone(DEFAULT_JOBS).map(normalizeJob);
  shortcuts=clone(DEFAULT_SHORTCUTS);
  offers=[];
  showGuest();
});

supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==="SIGNED_OUT") showGuest();
  if(event==="SIGNED_IN" && session?.user && session.user.id!==currentUser?.id){
    showSignedIn(session.user);
  }
});

async function init(){
  updateAll();

  const hashParams=new URLSearchParams(window.location.hash.replace(/^#/,""));
  const queryParams=new URLSearchParams(window.location.search);
  const authErrorCode=hashParams.get("error_code") || queryParams.get("error_code");

  const {data:{session}}=await supabaseClient.auth.getSession();

  if(session?.user){
    localStorage.removeItem(PENDING_EMAIL_KEY);
    history.replaceState({},document.title,window.location.pathname);
    await showSignedIn(session.user);
    return;
  }

  showGuest();

  if(authErrorCode==="otp_expired" || authErrorCode==="otp_disabled"){
    openAuth();
    setAuthMode("signin");
    showConfirmationNeeded(localStorage.getItem(PENDING_EMAIL_KEY),true);
    history.replaceState({},document.title,window.location.pathname);
  }
}

window.addEventListener("storage",event=>{
  if([STORAGE_KEY,SHORTCUTS_KEY,OFFERS_KEY].includes(event.key)){
    jobs=loadJSON(STORAGE_KEY, DEFAULT_JOBS).map(normalizeJob);
    shortcuts=loadJSON(SHORTCUTS_KEY, DEFAULT_SHORTCUTS);
    offers=loadJSON(OFFERS_KEY, []);
    updateAll();
  }
});

setAuthMode("signin");
init();
