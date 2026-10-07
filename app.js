const STORAGE_KEY = "job-search-dashboard-v1";

const DEFAULT_JOBS = [
 {id:"rhood",company:"Robinhood",role:"Associate Product Manager",city:"New York",industry:"Fintech",function:"Product",status:"Saved",saved:"4 days ago",deadline:"In 3 days",source:"LinkedIn",comp:"$120K–$140K",attention:true,next:"Submit application",nextDetail:"Tailor resume and apply before the deadline.",contacts:[["Sabrina Ali","Product leader · contacted 7 days ago"],["Andrew Gonzalez","Early Talent · potential recruiting contact"]],timeline:[["Saved role","Found on LinkedIn."],["Resume updated","Product-focused version drafted."],["Next","Submit before the deadline."]]},
 {id:"roblox",company:"Roblox",role:"APM Early Career",city:"San Francisco",industry:"Consumer Tech",function:"Product",status:"Saved",saved:"9 days ago",deadline:"In 11 days",source:"Company site",comp:"$135K–$155K",attention:true,next:"Decide whether to prioritize",nextDetail:"This role has been sitting in Saved for over a week.",contacts:[["Open","No contacts added yet"]],timeline:[["Saved role","Added from company careers page."],["No movement","Flagged as stale."]]},
 {id:"google",company:"Google",role:"Associate Product Marketing Manager",city:"New York",industry:"Consumer Tech",function:"Product",status:"Applying",saved:"2 days ago",deadline:"In 15 days",source:"Handshake",comp:"$126K–$180K",attention:false,next:"Finalize application",nextDetail:"Resume is tailored; submission is not complete.",contacts:[["Barnard alumna","Potential intro"]],timeline:[["Saved role","Pulled from Handshake."],["Draft started","Application is partly complete."]]},
 {id:"blackrock",company:"BlackRock",role:"Investment Research Analyst",city:"New York",industry:"Asset Management",function:"Finance",status:"Applied",saved:"12 days ago",deadline:"Submitted",source:"Company site",comp:"$95K–$123K",attention:false,next:"Wait for update",nextDetail:"No follow-up needed yet.",contacts:[["Current employee","Networking call completed"]],timeline:[["Saved","Added from careers site."],["Applied","Submitted 12 days ago."]]},
 {id:"mercor",company:"Mercor",role:"Operations / Product Generalist",city:"San Francisco",industry:"AI",function:"Product",status:"Applied",saved:"4 days ago",deadline:"Rolling",source:"Referral",comp:"Not listed",attention:false,next:"Monitor",nextDetail:"Consider follow-up next week if there is no response.",contacts:[["Point72 alum","Potential shared background"]],timeline:[["Saved","Added from company page."],["Applied","Submitted four days ago."]]},
 {id:"capital",company:"Capital One",role:"Business Analyst",city:"New York",industry:"Fintech",function:"Finance",status:"Interviewing",saved:"20 days ago",deadline:"Round 1 next Tue",source:"LinkedIn",comp:"$110K–$125K",attention:true,next:"Prep interview",nextDetail:"Behavioral and case prep due before Tuesday.",contacts:[["Recruiter","Interview scheduled"],["Friend at firm","Could provide context"]],timeline:[["Applied","Application submitted."],["Interview invite","First round scheduled."]]},
 {id:"offer",company:"Sample Tech",role:"Strategy & Operations Analyst",city:"New York",industry:"Consumer Tech",function:"Tech",status:"Offer",saved:"30 days ago",deadline:"Decision in 5 days",source:"Company site",comp:"$110K + $10K",attention:true,next:"Compare offer",nextDetail:"Use the offer comparison view before making a decision.",contacts:[["Hiring manager","Offer discussion complete"]],timeline:[["Applied","Submitted."],["Interviewed","Rounds complete."],["Offer","Decision due soon."]]}
];

function loadJobs(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(DEFAULT_JOBS);
  }catch{
    return structuredClone(DEFAULT_JOBS);
  }
}

function saveJobs(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

let jobs = loadJobs();
let activeStatusFilter = "All";
let activeChip = "All";

const statusClass = s => ({
 Saved:"status-saved", Applying:"status-applying", Applied:"status-applied", Interviewing:"status-interview", Offer:"status-offer"
}[s] || "status-saved");

function go(page){
 document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));
 document.getElementById(page).classList.add("active");
 document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>go(b.dataset.page));

function updateCounts(){
 document.getElementById("savedCount").textContent=jobs.filter(j=>j.status==="Saved").length;
 document.getElementById("appliedCount").textContent=jobs.filter(j=>j.status==="Applied").length;
 document.getElementById("interviewCount").textContent=jobs.filter(j=>j.status==="Interviewing").length;
 document.getElementById("attentionCount").textContent=jobs.filter(j=>j.attention).length;
}

function distribution(key){
 const counts={};
 jobs.forEach(j=>counts[j[key]]=(counts[j[key]]||0)+1);
 return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
}

const palette=["#284b59","#b98a46","#9d645a","#6a5e88","#6f8a72","#b7a89a"];

function renderDonut(key, donutId, legendId, totalId){
 const vals=distribution(key), total=jobs.length;
 document.getElementById(totalId).textContent=total;
 if(!total){
   document.getElementById(donutId).style.background="#eee6db";
   document.getElementById(legendId).innerHTML="";
   return;
 }
 let acc=0, parts=[];
 vals.forEach(([name,count],i)=>{
   const start=(acc/total)*100, end=((acc+count)/total)*100;
   parts.push(`${palette[i%palette.length]} ${start}% ${end}%`);
   acc+=count;
 });
 document.getElementById(donutId).style.background=`conic-gradient(${parts.join(",")})`;
 document.getElementById(legendId).innerHTML=vals.map(([name,count],i)=>{
   const pct=Math.round(count/total*100);
   return `<div class="legend-row"><span class="dot" style="background:${palette[i%palette.length]}"></span><span>${name}</span><strong>${pct}%</strong></div>`;
 }).join("");
}

function filteredJobs(){
 return jobs.filter(j=>{
   const statusOK = activeStatusFilter==="All" || (activeStatusFilter==="Attention" ? j.attention : j.status===activeStatusFilter);
   let chipOK=true;
   if(activeChip==="NYC") chipOK=j.city==="New York";
   else if(activeChip==="SF") chipOK=j.city==="San Francisco";
   else if(activeChip==="Product") chipOK=j.function==="Product";
   else if(activeChip==="Finance") chipOK=j.function==="Finance";
   else if(activeChip==="Tech") chipOK=j.function==="Tech" || ["AI","Consumer Tech"].includes(j.industry);
   return statusOK && chipOK;
 });
}

function renderJobs(){
 const list=filteredJobs();
 document.getElementById("visibleCount").textContent=`${list.length} role${list.length===1?"":"s"} shown`;
 const title = activeStatusFilter==="All" ? "All jobs" : activeStatusFilter==="Attention" ? "Needs attention" : `${activeStatusFilter} jobs`;
 document.getElementById("jobsTitle").textContent=title;
 document.getElementById("jobsSubtitle").textContent=activeStatusFilter==="Attention"
   ? "Roles with an upcoming deadline, stale status, follow-up, or another next action."
   : "Every opportunity in one place. Click any role to open its full page.";
 document.getElementById("jobsTable").innerHTML = `
   <div class="jobs-row header"><div>Role</div><div>Company / City</div><div>Status</div><div>Deadline</div><div>Saved</div><div>Next Action</div></div>
   ${list.map(j=>`
    <div class="jobs-row job" data-id="${j.id}">
      <div><div class="job-title">${j.role}</div><div class="small">${j.function} · ${j.industry}</div></div>
      <div><div class="job-title">${j.company}</div><div class="small">${j.city}</div></div>
      <div><span class="status-pill ${statusClass(j.status)}">${j.status}</span></div>
      <div><strong>${j.deadline}</strong></div>
      <div><strong>${j.saved}</strong></div>
      <div><strong>${j.next}</strong><div class="small">${j.attention?"Needs attention":"On track"}</div></div>
    </div>`).join("")}`;
 document.querySelectorAll(".jobs-row.job").forEach(r=>r.onclick=()=>openJob(r.dataset.id));
}

function openJob(id){
 const j=jobs.find(x=>x.id===id); if(!j)return;
 document.getElementById("detailStatus").className=`status-pill ${statusClass(j.status)}`;
 document.getElementById("detailStatus").textContent=j.status;
 document.getElementById("detailRole").textContent=j.role;
 document.getElementById("detailCompany").textContent=`${j.company} · ${j.city} · ${j.function} · ${j.industry}`;
 document.getElementById("detailSaved").textContent=j.saved;
 document.getElementById("detailDeadline").textContent=j.deadline;
 document.getElementById("detailSource").textContent=j.source;
 document.getElementById("detailComp").textContent=j.comp;
 document.getElementById("detailNext").innerHTML=`<div class="list-item"><strong>${j.next}</strong>${j.nextDetail}</div>`;
 document.getElementById("detailContacts").innerHTML=j.contacts.map(c=>`<div class="list-item"><strong>${c[0]}</strong>${c[1]}</div>`).join("");
 document.getElementById("detailTimeline").innerHTML=j.timeline.map(t=>`<div class="list-item"><strong>${t[0]}</strong>${t[1]}</div>`).join("");
 go("detail");
}

document.querySelectorAll(".metric").forEach(m=>m.onclick=()=>{
 activeStatusFilter=m.dataset.filter;
 activeChip="All";
 document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c.dataset.chip==="All"));
 renderJobs();
 go("jobs");
});

document.querySelectorAll("[data-open-job]").forEach(x=>x.onclick=()=>openJob(x.dataset.openJob));

document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
 activeChip=c.dataset.chip;
 document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===c));
 renderJobs();
});

document.getElementById("clearFilter").onclick=()=>{
 activeStatusFilter="All";
 activeChip="All";
 document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c.dataset.chip==="All"));
 renderJobs();
};

document.getElementById("backToJobs").onclick=()=>{renderJobs();go("jobs");};

const backdrop=document.getElementById("modalBackdrop");
function showModal(){backdrop.classList.add("show")}
function hideModal(){backdrop.classList.remove("show")}

document.getElementById("addBtn").onclick=showModal;
document.getElementById("addBtn2").onclick=showModal;
document.getElementById("pasteBtn").onclick=()=>alert("Next build: paste a LinkedIn / Handshake / company careers URL and prefill the job fields automatically.");
document.getElementById("cancelModal").onclick=hideModal;

document.getElementById("saveJob").onclick=()=>{
 const id="job"+Date.now();
 jobs.unshift({
   id,
   company:document.getElementById("fCompany").value||"New company",
   role:document.getElementById("fRole").value||"New role",
   city:document.getElementById("fCity").value,
   industry:document.getElementById("fIndustry").value,
   function:document.getElementById("fIndustry").value==="Asset Management"?"Finance":"Product",
   status:document.getElementById("fStatus").value,
   saved:"Just now",
   deadline:document.getElementById("fDeadline").value||"No deadline",
   source:"Manual",
   comp:"Not added",
   attention:false,
   next:"Review role",
   nextDetail:"Add compensation, contacts, and application notes.",
   contacts:[["No contacts yet","Add someone you may want to reach out to."]],
   timeline:[["Saved role","Added manually just now."]]
 });
 saveJobs();
 updateAll();
 hideModal();
};

function updateAll(){
 updateCounts();
 renderDonut("city","cityDonut","cityLegend","cityTotal");
 renderDonut("industry","industryDonut","industryLegend","industryTotal");
 renderJobs();
}

updateAll();
