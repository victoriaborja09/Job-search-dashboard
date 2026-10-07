const STORAGE_KEY = "job-search-dashboard-v2";
const SHORTCUTS_KEY = "job-search-dashboard-shortcuts-v1";
const OFFERS_KEY = "job-search-dashboard-offers-v1";

const DEFAULT_JOBS = [
  {
    id:"rhood",
    company:"Robinhood",
    role:"Associate Product Manager",
    city:"New York",
    industry:"Fintech",
    function:"Product",
    status:"Saved",
    saved:"4 days ago",
    deadline:"In 3 days",
    source:"LinkedIn",
    comp:"$120K–$140K",
    attention:true,
    next:"Submit application",
    nextDetail:"Tailor resume and apply before the deadline.",
    jobUrl:"https://careers.robinhood.com/",
    resumeUrl:"",
    notes:"",
    contacts:[
      {name:"Sabrina Ali",role:"Product leader",link:"",last:"2026-09-30",followUp:"2026-10-07"},
      {name:"Andrew Gonzalez",role:"Early Talent",link:"",last:"",followUp:""}
    ],
    timeline:[
      ["Saved role","Found on LinkedIn."],
      ["Resume updated","Product-focused version drafted."],
      ["Next","Submit before the deadline."]
    ]
  },
  {
    id:"roblox",
    company:"Roblox",
    role:"APM Early Career",
    city:"San Francisco",
    industry:"Consumer Tech",
    function:"Product",
    status:"Saved",
    saved:"9 days ago",
    deadline:"In 11 days",
    source:"Company site",
    comp:"$135K–$155K",
    attention:true,
    next:"Decide whether to prioritize",
    nextDetail:"This role has been sitting in Saved for over a week.",
    jobUrl:"https://careers.roblox.com/",
    resumeUrl:"",
    notes:"",
    contacts:[],
    timeline:[
      ["Saved role","Added from company careers page."],
      ["No movement","Flagged as stale."]
    ]
  },
  {
    id:"google",
    company:"Google",
    role:"Associate Product Marketing Manager",
    city:"New York",
    industry:"Consumer Tech",
    function:"Product",
    status:"Applying",
    saved:"2 days ago",
    deadline:"In 15 days",
    source:"Handshake",
    comp:"$126K–$180K",
    attention:false,
    next:"Finalize application",
    nextDetail:"Resume is tailored; submission is not complete.",
    jobUrl:"https://careers.google.com/",
    resumeUrl:"",
    notes:"",
    contacts:[{name:"Barnard alumna",role:"Potential intro",link:"",last:"",followUp:""}],
    timeline:[
      ["Saved role","Pulled from Handshake."],
      ["Draft started","Application is partly complete."]
    ]
  },
  {
    id:"blackrock",
    company:"BlackRock",
    role:"Investment Research Analyst",
    city:"New York",
    industry:"Asset Management",
    function:"Finance",
    status:"Applied",
    saved:"12 days ago",
    deadline:"Submitted",
    source:"Company site",
    comp:"$95K–$123K",
    attention:false,
    next:"Wait for update",
    nextDetail:"No follow-up needed yet.",
    jobUrl:"https://careers.blackrock.com/",
    resumeUrl:"",
    notes:"",
    contacts:[{name:"Current employee",role:"Networking call completed",link:"",last:"",followUp:""}],
    timeline:[
      ["Saved","Added from careers site."],
      ["Applied","Submitted 12 days ago."]
    ]
  },
  {
    id:"mercor",
    company:"Mercor",
    role:"Operations / Product Generalist",
    city:"San Francisco",
    industry:"AI",
    function:"Product",
    status:"Applied",
    saved:"4 days ago",
    deadline:"Rolling",
    source:"Referral",
    comp:"Not listed",
    attention:false,
    next:"Monitor",
    nextDetail:"Consider follow-up next week if there is no response.",
    jobUrl:"https://mercor.com/",
    resumeUrl:"",
    notes:"",
    contacts:[{name:"Point72 alum",role:"Potential shared background",link:"",last:"",followUp:""}],
    timeline:[
      ["Saved","Added from company page."],
      ["Applied","Submitted four days ago."]
    ]
  },
  {
    id:"capital",
    company:"Capital One",
    role:"Business Analyst",
    city:"New York",
    industry:"Fintech",
    function:"Finance",
    status:"Interviewing",
    saved:"20 days ago",
    deadline:"Round 1 next Tue",
    source:"LinkedIn",
    comp:"$110K–$125K",
    attention:true,
    next:"Prep interview",
    nextDetail:"Behavioral and case prep due before Tuesday.",
    jobUrl:"https://www.capitalonecareers.com/",
    resumeUrl:"",
    notes:"",
    contacts:[
      {name:"Recruiter",role:"Interview scheduled",link:"",last:"",followUp:""},
      {name:"Friend at firm",role:"Could provide context",link:"",last:"",followUp:""}
    ],
    timeline:[
      ["Applied","Application submitted."],
      ["Interview invite","First round scheduled."]
    ]
  },
  {
    id:"offer",
    company:"Sample Tech",
    role:"Strategy & Operations Analyst",
    city:"New York",
    industry:"Consumer Tech",
    function:"Tech",
    status:"Offer",
    saved:"30 days ago",
    deadline:"Decision in 5 days",
    source:"Company site",
    comp:"$110K + $10K",
    attention:true,
    next:"Compare offer",
    nextDetail:"Use the offer comparison view before making a decision.",
    jobUrl:"",
    resumeUrl:"",
    notes:"",
    contacts:[{name:"Hiring manager",role:"Offer discussion complete",link:"",last:"",followUp:""}],
    timeline:[
      ["Applied","Submitted."],
      ["Interviewed","Rounds complete."],
      ["Offer","Decision due soon."]
    ]
  }
];

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
  return {
    id:job.id || "job"+Date.now()+Math.random().toString(16).slice(2),
    company:job.company || "New company",
    role:job.role || "New role",
    city:job.city || "Other",
    industry:job.industry || "Other",
    function:job.function || "Other",
    status:job.status || "Saved",
    saved:job.saved || "Just now",
    deadline:job.deadline || "No deadline",
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
let offers = loadJSON(OFFERS_KEY, SAMPLE_OFFERS);

let activeStatusFilter = "All";
let activeChip = "All";
let activeDimensionFilter = null;
let activeJobId = null;
let editingJobId = null;

function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
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

function go(page){
  document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));
  document.getElementById(page).classList.add("active");
  document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>{
  if(b.dataset.page==="jobs"){
    activeStatusFilter="All";
    activeChip="All";
    activeDimensionFilter=null;
    syncChips();
    renderJobs();
  }
  go(b.dataset.page);
});

function activeJobs(){
  return jobs.filter(j=>!j.archived);
}

function updateCounts(){
  const current=activeJobs();
  document.getElementById("savedCount").textContent=current.filter(j=>j.status==="Saved").length;
  document.getElementById("appliedCount").textContent=current.filter(j=>j.status==="Applied").length;
  document.getElementById("interviewCount").textContent=current.filter(j=>j.status==="Interviewing").length;
  document.getElementById("attentionCount").textContent=current.filter(j=>j.attention).length;
}

function distribution(key){
  const counts={};
  activeJobs().forEach(j=>counts[j[key]]=(counts[j[key]]||0)+1);
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
  activeChip="All";
  activeDimensionFilter={key,value};
  syncChips();
  renderJobs();
  go("jobs");
}

function renderDonut(key, donutId, legendId, totalId){
  const vals=distribution(key);
  const total=activeJobs().length;
  document.getElementById(totalId).textContent=total;

  const host=document.getElementById(donutId);
  const legend=document.getElementById(legendId);

  if(!total){
    host.innerHTML='<div class="donut-center"><div><strong>0</strong><span>jobs</span></div></div>';
    host.style.background="#eee6db";
    legend.innerHTML="<span class='small'>No jobs yet</span>";
    return;
  }

  host.style.background="transparent";
  let angle=0;
  const paths=vals.map(([name,count],i)=>{
    const fraction=count/total;
    const start=angle;
    const end=angle+(fraction*360);
    angle=end;
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
      d="${donutPath(75,75,63,35,start,end)}"></path>`;
  }).join("");

  host.innerHTML=`
    <svg viewBox="0 0 150 150" aria-label="${escapeHTML(key)} breakdown">
      ${paths}
    </svg>
    <div class="donut-center"><div><strong>${total}</strong><span>jobs</span></div></div>
    <div class="donut-tooltip"></div>
  `;

  const tooltip=host.querySelector(".donut-tooltip");
  const segments=[...host.querySelectorAll(".donut-segment")];

  function show(seg){
    tooltip.textContent=`${seg.dataset.pct}% ${seg.dataset.label}`;
    tooltip.classList.add("show");
    segments.forEach(s=>s.classList.toggle("is-dimmed",s!==seg));
  }
  function hide(){
    tooltip.classList.remove("show");
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
  const deadlineJob=current
    .map(j=>({job:j,days:parseRelativeDays(j.deadline)}))
    .filter(x=>Number.isFinite(x.days) && x.days>=0)
    .sort((a,b)=>a.days-b.days)[0]?.job;

  const today=new Date();
  today.setHours(0,0,0,0);

  let followup=null;
  for(const job of current){
    for(const contact of job.contacts){
      if(!contact.followUp) continue;
      const d=new Date(contact.followUp+"T00:00:00");
      if(!Number.isNaN(d.getTime()) && d<=today){
        followup={job,contact,date:d};
        break;
      }
    }
    if(followup) break;
  }

  const staleJob=current
    .filter(j=>j.status==="Saved")
    .map(j=>({job:j,days:parseSavedDays(j.saved)}))
    .filter(x=>x.days>=7)
    .sort((a,b)=>b.days-a.days)[0]?.job;

  const cards=[];

  if(deadlineJob){
    cards.push({
      cls:"deadline",
      title:"Deadline coming up",
      text:`<strong>${escapeHTML(deadlineJob.company)} · ${escapeHTML(deadlineJob.role)}</strong> is due <strong>${escapeHTML(deadlineJob.deadline.toLowerCase())}</strong>.`,
      id:deadlineJob.id
    });
  }else{
    cards.push({cls:"deadline empty",title:"No urgent deadlines",text:"Nothing in your saved list is approaching a tracked deadline.",id:""});
  }

  if(followup){
    cards.push({
      cls:"followup",
      title:"Follow-up due",
      text:`<strong>${escapeHTML(followup.contact.name)}</strong> is due for a follow-up on the ${escapeHTML(followup.job.company)} role.`,
      id:followup.job.id
    });
  }else{
    cards.push({cls:"followup empty",title:"No follow-ups due",text:"Add follow-up dates to contacts and they will surface here automatically.",id:""});
  }

  if(staleJob){
    cards.push({
      cls:"stale",
      title:"Saved but stale",
      text:`<strong>${escapeHTML(staleJob.company)} · ${escapeHTML(staleJob.role)}</strong> has been saved for ${parseSavedDays(staleJob.saved)} days without moving forward.`,
      id:staleJob.id
    });
  }else{
    cards.push({cls:"stale empty",title:"Nothing stale",text:"Your saved roles are moving or were added recently.",id:""});
  }

  const grid=document.getElementById("attentionGrid");
  grid.innerHTML=cards.map(card=>`
    <button class="attention ${card.cls}" ${card.id ? `data-attention-job="${card.id}"` : ""}>
      <h4>${card.title}</h4>
      <p>${card.text}</p>
    </button>
  `).join("");

  grid.querySelectorAll("[data-attention-job]").forEach(btn=>{
    btn.onclick=()=>openJob(btn.dataset.attentionJob);
  });
}

function parseRelativeDays(text){
  const match=String(text||"").match(/in\s+(\d+)\s+day/i);
  return match ? Number(match[1]) : NaN;
}

function parseSavedDays(text){
  if(String(text||"").toLowerCase().includes("just now")) return 0;
  const match=String(text||"").match(/(\d+)\s+day/i);
  return match ? Number(match[1]) : 0;
}

function renderQuickLinks(){
  const box=document.getElementById("quickLinks");
  box.innerHTML=shortcuts.map(item=>`
    <a class="quick-link" href="${safeURL(item.url) || "#"}" target="_blank" rel="noopener">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <span>${escapeHTML(item.description || "")}</span>
      </div>
      <div class="arrow">↗</div>
    </a>
  `).join("");
}

function filteredJobs(){
  return activeJobs().filter(j=>{
    const statusOK = activeStatusFilter==="All" ||
      (activeStatusFilter==="Attention" ? j.attention : j.status===activeStatusFilter);

    let chipOK=true;
    if(activeChip==="NYC") chipOK=j.city.toLowerCase().includes("new york");
    else if(activeChip==="SF") chipOK=j.city.toLowerCase().includes("san francisco") || j.city.toLowerCase().includes("san mateo");
    else if(activeChip==="Product") chipOK=j.function==="Product";
    else if(activeChip==="Finance") chipOK=j.function==="Finance";
    else if(activeChip==="Tech") chipOK=j.function==="Tech" || ["AI","Consumer Tech"].includes(j.industry);

    const dimensionOK = !activeDimensionFilter ||
      String(j[activeDimensionFilter.key] || "")===activeDimensionFilter.value;

    return statusOK && chipOK && dimensionOK;
  });
}

function syncChips(){
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c.dataset.chip===activeChip));
}

function renderJobs(){
  const list=filteredJobs();
  document.getElementById("visibleCount").textContent=`${list.length} role${list.length===1?"":"s"} shown`;

  const title=activeDimensionFilter
    ? `${activeDimensionFilter.value} jobs`
    : activeStatusFilter==="All"
      ? "All jobs"
      : activeStatusFilter==="Attention"
        ? "Needs attention"
        : `${activeStatusFilter} jobs`;

  document.getElementById("jobsTitle").textContent=title;
  document.getElementById("jobsSubtitle").textContent=activeDimensionFilter
    ? `Showing jobs where ${activeDimensionFilter.key} is ${activeDimensionFilter.value}. Click any role to open its full page.`
    : activeStatusFilter==="Attention"
      ? "Roles with a deadline, follow-up, stale status, or another next action."
      : "Every opportunity in one place. Click any role to open its full page.";

  const table=document.getElementById("jobsTable");

  if(!list.length){
    table.innerHTML="<div class='list-item'>No jobs match this view yet.</div>";
    return;
  }

  table.innerHTML=`
    <div class="jobs-row header">
      <div>Role</div><div>Company / City</div><div>Status</div><div>Deadline</div><div>Saved</div><div>Next Action</div>
    </div>
    ${list.map(j=>`
      <div class="jobs-row job" data-id="${j.id}">
        <div><div class="job-title">${escapeHTML(j.role)}</div><div class="small">${escapeHTML(j.function)} · ${escapeHTML(j.industry)}</div></div>
        <div><div class="job-title">${escapeHTML(j.company)}</div><div class="small">${escapeHTML(j.city)}</div></div>
        <div><span class="status-pill ${statusClass(j.status)}">${escapeHTML(j.status)}</span></div>
        <div><strong>${escapeHTML(j.deadline)}</strong></div>
        <div><strong>${escapeHTML(j.saved)}</strong></div>
        <div><strong>${escapeHTML(j.next)}</strong><div class="small">${j.attention?"Needs attention":"On track"}</div></div>
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

function openJob(id){
  const j=jobs.find(x=>x.id===id);
  if(!j) return;

  activeJobId=id;

  document.getElementById("detailStatus").className=`status-pill ${statusClass(j.status)}`;
  document.getElementById("detailStatus").textContent=j.status;
  document.getElementById("detailStatusSelect").value=j.status;
  document.getElementById("detailRole").textContent=j.role;
  document.getElementById("detailCompany").textContent=`${j.company} · ${j.city} · ${j.function} · ${j.industry}`;
  document.getElementById("detailSaved").textContent=j.saved;
  document.getElementById("detailDeadline").textContent=j.deadline;
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
        date:new Date().toISOString().slice(0,10),
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
  activeStatusFilter=m.dataset.filter;
  activeChip="All";
  activeDimensionFilter=null;
  syncChips();
  renderJobs();
  go("jobs");
});

document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
  activeChip=c.dataset.chip;
  activeDimensionFilter=null;
  syncChips();
  renderJobs();
});

document.getElementById("clearFilter").onclick=()=>{
  activeStatusFilter="All";
  activeChip="All";
  activeDimensionFilter=null;
  syncChips();
  renderJobs();
};

document.getElementById("backToJobs").onclick=()=>{
  renderJobs();
  go("jobs");
};

document.getElementById("detailStatusSelect").onchange=e=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;

  const old=j.status;
  j.status=e.target.value;
  j.attention=["Saved","Applying","Interviewing","Offer"].includes(j.status);
  j.timeline.unshift(normalizeTimelineEntry({
    title:"Status updated",
    detail:`${old} → ${j.status}`,
    date:new Date().toISOString().slice(0,10),
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

document.getElementById("deleteJobBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  if(!confirm(`Delete ${j.company} · ${j.role}? This cannot be undone.`)) return;

  jobs=jobs.filter(x=>x.id!==activeJobId);
  activeJobId=null;
  persist();
  updateAll();
  go("jobs");
  toast("Job deleted");
};

const jobBackdrop=document.getElementById("jobModalBackdrop");

function showJobModal(job=null,initialUrl=""){
  editingJobId=job?.id || null;
  document.getElementById("jobModalTitle").textContent=job ? "Edit job" : "Add a job";
  document.getElementById("fCompany").value=job?.company || "";
  document.getElementById("fRole").value=job?.role || "";
  document.getElementById("fCity").value=job?.city || "";
  document.getElementById("fIndustry").value=job?.industry || "";
  document.getElementById("fFunction").value=job?.function || "Product";
  document.getElementById("fStatus").value=job?.status || "Saved";
  document.getElementById("fDeadline").value=job?.deadline || "";
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

function inferSource(url){
  try{
    const host=new URL(url).hostname.toLowerCase();
    if(host.includes("linkedin")) return "LinkedIn";
    if(host.includes("joinhandshake") || host.includes("handshake")) return "Handshake";
    if(host.includes("indeed")) return "Indeed";
    return "Company site";
  }catch{
    return "";
  }
}

document.getElementById("addBtn").onclick=()=>showJobModal();
document.getElementById("addBtn2").onclick=()=>showJobModal();
document.getElementById("editJobBtn").onclick=()=>{
  const j=jobs.find(x=>x.id===activeJobId);
  if(j) showJobModal(j);
};
document.getElementById("cancelJobModal").onclick=hideJobModal;

document.getElementById("pasteBtn").onclick=()=>{
  const url=prompt("Paste the job posting URL:");
  if(!url) return;
  showJobModal(null,url.trim());
};

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
      city:document.getElementById("fCity").value.trim() || "Other",
      industry:document.getElementById("fIndustry").value.trim() || "Other",
      function:document.getElementById("fFunction").value,
      status:document.getElementById("fStatus").value,
      deadline:document.getElementById("fDeadline").value.trim() || "No deadline",
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
      date:new Date().toISOString().slice(0,10),
      type:"Custom"
    }));
    persist();
    hideJobModal();
    updateAll();
    openJob(j.id);
    toast("Job updated");
    return;
  }

  const j=normalizeJob({
    id:"job"+Date.now(),
    company,
    role,
    city:document.getElementById("fCity").value.trim() || "Other",
    industry:document.getElementById("fIndustry").value.trim() || "Other",
    function:document.getElementById("fFunction").value,
    status:document.getElementById("fStatus").value,
    saved:"Just now",
    deadline:document.getElementById("fDeadline").value.trim() || "No deadline",
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
      date:new Date().toISOString().slice(0,10),
      type:"Application"
    }]
  });

  jobs.unshift(j);
  persist();
  hideJobModal();
  updateAll();
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
    date:new Date().toISOString().slice(0,10),
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
  document.getElementById("tDate").value=new Date().toISOString().slice(0,10);
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

function updateAll(){
  updateCounts();
  renderAttention();
  renderDonut("city","cityDonut","cityLegend","cityTotal");
  renderDonut("industry","industryDonut","industryLegend","industryTotal");
  renderQuickLinks();
  renderJobs();
  renderOffers();
}

updateAll();
