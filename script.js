const $ = id => document.getElementById(id);
const themeSelect = $('theme');
const savedTheme = localStorage.getItem('resume-analyzer-theme');
const themes = ['light', 'dark', 'midnight', 'plum', 'forest', 'ember', 'ocean', 'rose'];
if (savedTheme && themes.includes(savedTheme)) {
    document.documentElement.dataset.theme = savedTheme;
    themeSelect.value = savedTheme;
}
themeSelect.addEventListener('change', () => {
    document.documentElement.dataset.theme = themeSelect.value;
    localStorage.setItem('resume-analyzer-theme', themeSelect.value);
});
const rx = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const RAW = {
    "Languages": ["Python", "Java", "JavaScript|js|es6", "TypeScript", "C++", "C#", "PHP", "Golang", "Kotlin", "Swift", "SQL", "HTML|html5", "CSS|css3", "Dart", "Ruby", "Rust"],
    "Frameworks": ["React|reactjs|react.js", "Angular", "Vue|vue.js", "Next.js|nextjs", "Node.js|nodejs|node", "Express|express.js", "Spring Boot|springboot", "Spring", "Django", "Flask", "FastAPI", "Laravel", ".NET|asp.net", "Bootstrap", "Tailwind|tailwind css", "Flutter", "React Native", "jQuery", "Redux"],
    "Data & AI": ["Machine Learning|ml", "Deep Learning", "NLP|natural language processing", "Pandas", "NumPy", "Scikit-learn|sklearn", "TensorFlow", "PyTorch", "Power BI", "Tableau", "Excel|ms excel", "Data Analysis", "Data Visualization", "Statistics", "OpenCV", "LLM|llms", "Generative AI|genai"],
    "Databases": ["MySQL", "PostgreSQL|postgres", "MongoDB|mongo", "SQLite", "Oracle", "Redis", "Firebase", "NoSQL"],
    "Cloud & DevOps": ["AWS", "Azure", "GCP|google cloud", "Docker", "Kubernetes|k8s", "Jenkins", "CI/CD|cicd", "Terraform", "Linux", "GitHub Actions", "Nginx"],
    "Tools": ["Git", "GitHub", "GitLab", "Jira", "Postman", "VS Code|vscode", "Figma", "Swagger", "Maven"],
    "Concepts": ["REST API|restful|rest apis", "OOP|oops|object oriented", "Data Structures|dsa", "Algorithms", "Microservices", "Agile", "Scrum", "MVC", "Unit Testing", "JUnit", "Selenium", "API|apis", "JWT|authentication", "System Design", "Debugging", "Multithreading"],
    "Soft Skills": ["Communication", "Teamwork|team player|collaboration", "Leadership", "Problem Solving", "Time Management", "Adaptability"]
};
const ALL = []; for (const [cat, l] of Object.entries(RAW)) for (const e of l) { const [n, ...a] = e.split('|'); ALL.push({ n, cat, re: new RegExp('(?<![a-z0-9+#.])(?:' + [n, ...a].map(rx).join('|') + ')(?![a-z0-9+#])', 'i') }) }
const ROLES = {
    "Frontend Developer": ["JavaScript", "TypeScript", "HTML", "CSS", "React", "Angular", "Vue", "Redux", "Git", "REST API", "Tailwind", "Bootstrap", "Figma"],
    "Backend Developer": ["Java", "Python", "Node.js", "Express", "Spring Boot", "Django", "SQL", "MySQL", "PostgreSQL", "MongoDB", "REST API", "Microservices", "Docker", "Git", "JWT"],
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "Express", "HTML", "CSS", "MongoDB", "SQL", "REST API", "Git", "Docker", "TypeScript", "MySQL"],
    "Java Developer": ["Java", "Spring Boot", "Spring", "MySQL", "Maven", "JUnit", "REST API", "Microservices", "OOP", "Data Structures", "Git", "Multithreading"],
    "Python Developer": ["Python", "Django", "Flask", "FastAPI", "SQL", "PostgreSQL", "REST API", "Git", "Docker", "Pandas", "OOP", "Unit Testing"],
    "Data Analyst": ["SQL", "Excel", "Python", "Pandas", "NumPy", "Power BI", "Tableau", "Data Analysis", "Data Visualization", "Statistics"],
    "ML / AI Engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "NLP", "LLM", "Statistics", "Docker"],
    "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "AWS", "Azure", "Jenkins", "CI/CD", "Terraform", "Git", "GitHub Actions", "Nginx", "Python"],
    "Mobile Developer": ["Flutter", "Dart", "React Native", "Kotlin", "Swift", "Firebase", "REST API", "Git", "JavaScript"],
    "QA / Test Engineer": ["Selenium", "Unit Testing", "JUnit", "Postman", "Java", "Python", "SQL", "Jira", "Agile", "API", "CI/CD"]
};
const STOP = new Set("the and for with you your our are will have has this that from was were can able such they their them but not all any per etc who what when where which while into out about over more than also may must should would could job role work team years year experience strong good knowledge skills skill ability looking candidate candidates required requirements responsibilities preferred plus including include etc using use used new well like other others within across across across across help part full time company working works based related understanding excellent seeking join opportunity benefits apply".split(" "));
const VERBS = "developed built designed implemented created led optimized deployed integrated automated improved managed engineered analyzed reduced increased launched tested collaborated migrated architected delivered maintained".split(" ");
const SEC = { Summary: /summary|objective|profile/i, Education: /education|academic/i, Experience: /experience|internship|employment/i, Projects: /projects?/i, Skills: /skills|technologies/i, Certifications: /certifications?|achievements|awards/i };
const detect = t => { const s = new Set(); ALL.forEach(k => { if (k.re.test(t)) s.add(k.n) }); return s };
const lc = s => s.toLowerCase();

// PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
async function readPDF(file) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
        const c = await (await pdf.getPage(p)).getTextContent(); let y = null, line = '';
        for (const it of c.items) { const yy = Math.round(it.transform[5]); if (y !== null && Math.abs(yy - y) > 3) { out.push(line.trim()); line = '' } line += it.str + ' '; y = yy }
        out.push(line.trim())
    }
    return out.filter(Boolean).join('\n')
}
const drop = $('drop'), fi = $('f');
drop.onclick = () => fi.click();
drop.ondragover = e => { e.preventDefault(); drop.classList.add('on') }; drop.ondragleave = () => drop.classList.remove('on');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('on'); if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]) };
fi.onchange = () => fi.files[0] && load(fi.files[0]);
async function load(file) {
    $('st').textContent = 'Reading ' + file.name + '…';
    try {
        const t = await readPDF(file); $('resume').value = t;
        $('st').textContent = t.length < 50 ? 'Little text found — this may be a scanned image PDF. Paste your text instead.' : 'Extracted ' + t.split(/\s+/).length + ' words from ' + file.name
    }
    catch (e) { $('st').textContent = 'Could not read that PDF. Paste your resume text instead.' }
}

// Analysis
function analyze() {
    const rt = $('resume').value.trim(), jd = $('jd').value.trim();
    if (rt.length < 50) { $('st').textContent = 'Please upload a PDF or paste your resume text first.'; return }
    const rs = detect(rt), js = jd ? detect(jd) : new Set();
    const matched = [...js].filter(s => rs.has(s)), missing = [...js].filter(s => !rs.has(s));
    // keywords
    let kws = [];
    if (jd) {
        const cnt = {}; (lc(jd).match(/[a-z][a-z0-9+#.]+/g) || []).forEach(w => { w = w.replace(/\.+$/, ''); if (w.length > 2 && !STOP.has(w) && !ALL.some(k => k.re.test(w))) cnt[w] = (cnt[w] || 0) + 1 });
        kws = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([w, n]) => ({ w, n, has: new RegExp('(?<![a-z0-9])' + rx(w) + '(?![a-z0-9])', 'i').test(rt) }))
    }
    // roles
    const roles = Object.entries(ROLES).map(([r, l]) => [r, Math.round(100 * l.filter(s => rs.has(s)).length / l.length)]).sort((a, b) => b[1] - a[1]);
    const jdRole = jd && js.size ? Object.entries(ROLES).map(([r, l]) => [r, l.filter(s => js.has(s)).length]).sort((a, b) => b[1] - a[1])[0] : null;
    // structure
    const heads = rt.split('\n').filter(l => l.length < 40).join('\n');
    const found = Object.keys(SEC).filter(k => SEC[k].test(heads)), lackSec = Object.keys(SEC).filter(k => !found.includes(k));
    const words = rt.split(/\s+/).length, nums = (rt.match(/\d+(\.\d+)?\s?(%|\+|x\b|k\b)|(\$|₹|rs\.?)\s?\d/gi) || []).length;
    const verbs = VERBS.filter(v => new RegExp('\\b' + v + '\\b', 'i').test(rt)).length;
    const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(rt), phone = /\+?\d[\d\s-]{8,}\d/.test(rt), link = /linkedin\.com|github\.com/i.test(rt), gh = /github\.com/i.test(rt);
    // scores
    const skFit = jd && js.size ? matched.length / js.size : roles[0][1] / 100;
    const kwFit = kws.length ? kws.filter(k => k.has).length / kws.length : Math.min(rs.size, 15) / 15;
    const B = [
        [jd && js.size ? 'Skill match with JD' : 'Skill fit (best role)', Math.round(40 * skFit), 40],
        [kws.length ? 'Keyword coverage' : 'Skill breadth', Math.round(20 * kwFit), 20],
        ['Structure & length', Math.round(12 * found.length / 6 + (words >= 250 && words <= 900 ? 3 : words >= 150 ? 1 : 0)), 15],
        ['Impact (metrics & action verbs)', Math.round(8 * Math.min(nums, 5) / 5 + 7 * Math.min(verbs, 6) / 6), 15],
        ['Contact & links', (email ? 4 : 0) + (phone ? 3 : 0) + (link ? 3 : 0), 10]];
    const score = B.reduce((a, b) => a + b[1], 0);
    const lbl = score >= 80 ? 'Strong' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Needs work';
    // suggestions
    const S = [];
    if (missing.length) S.push(`Add these JD skills <b>only where you genuinely have them</b>: ${missing.slice(0, 8).join(', ')}. Put them in your Skills section and show them in a project or internship bullet.`);
    if (missing.length > 4) S.push('If you lack several of these skills, build one small project using them and link it on your resume — it closes the gap faster than listing them.');
    const kwm = kws.filter(k => !k.has).slice(0, 6).map(k => k.w);
    if (kwm.length) S.push(`Mirror the JD's wording where truthful — missing terms: ${kwm.join(', ')}. Many applicant tracking systems match exact phrases.`);
    if (lackSec.length) S.push(`Add missing sections: ${lackSec.join(', ')}. For freshers, a Projects section is especially important.`);
    if (nums < 3) S.push('Quantify your impact. Only ' + nums + ' number/metric found — write things like “reduced load time by 30%” or “built an app used by 200+ students”.');
    if (verbs < 4) S.push('Start bullets with strong action verbs (built, designed, implemented, optimized, deployed) instead of “responsible for”.');
    if (!gh) S.push('Add your GitHub profile link so recruiters can see your code.');
    if (!link || !email || !phone) S.push('Make sure email, phone and a LinkedIn/GitHub link are all visible at the top.');
    if (words < 250) S.push('Your resume looks thin (' + words + ' words). Expand project descriptions with the tech stack, your role and the result.');
    if (words > 900) S.push('Your resume is long (' + words + ' words). Fresher resumes work best on one page — cut older or less relevant items.');
    if (!S.length) S.push('Looks solid! Tailor the summary and top bullets to each job you apply to.');
    // explanation
    const ex = `Your score of <b>${score}/100</b> is built from five parts. ` + (jd && js.size ? `The JD mentions ${js.size} recognised skills and your resume covers ${matched.length} of them (${Math.round(100 * skFit)}%). ` : `Without a job description, skills are compared to the best-fitting role (${roles[0][0]}, ${roles[0][1]}% match). `) + `Structure: ${found.length}/6 standard sections found. Impact: ${nums} metrics and ${verbs} action verbs. Fix the lowest-scoring bars first for the biggest gain.`;
    const ch = (a, c) => a.map(x => `<span class="chip ${c || ''}">${x}</span>`).join('') || '<span class="mu">None</span>';
    const grp = {};[...rs].forEach(n => { const c = ALL.find(k => k.n === n).cat; (grp[c] = grp[c] || []).push(n) });
    const R = 2 * Math.PI * 44, col = score >= 65 ? 'var(--ok)' : score >= 45 ? 'var(--wr)' : 'var(--bad)';
    $('res').style.display = 'block';
    $('res').innerHTML = `<div class="c"><div class="top">
 <svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r="44" fill="none" stroke="var(--bd)" stroke-width="10"/><circle cx="55" cy="55" r="44" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${R * score / 100} ${R}" transform="rotate(-90 55 55)"/><text x="55" y="63" text-anchor="middle" font-size="26" font-weight="700" fill="var(--tx)">${score}</text></svg>
 <div style="flex:1;min-width:220px"><div class="big" style="color:${col}">${lbl}</div><p style="margin:4px 0 0">${ex}</p></div></div>
 ${B.map(b => `<div class="row"><span>${b[0]}</span><span>${b[1]}/${b[2]}</span></div><div class="bar"><i style="width:${100 * b[1] / b[2]}%"></i></div>`).join('')}</div>
 <div class="g s"><div class="c"><h2>Detected skills (${rs.size})</h2>${Object.entries(grp).map(([c, l]) => `<div class="mu" style="font-size:12px;margin-top:8px">${c}</div>${ch(l)}`).join('') || '<span class="mu">No known skills detected</span>'}</div>
 <div class="c"><h2>Job-role match</h2>${roles.slice(0, 5).map(r => `<div class="row"><span>${r[0]}</span><span>${r[1]}%</span></div><div class="bar"><i style="width:${r[1]}%"></i></div>`).join('')}${jdRole ? `<p class="mu" style="font-size:13px">The job description looks like a <b>${jdRole[0]}</b> role.</p>` : ''}</div></div>
 ${jd ? `<div class="g s"><div class="c"><h2>Resume vs JD</h2><div class="mu" style="font-size:12px">Matched (${matched.length})</div>${ch(matched, 'ok')}<div class="mu" style="font-size:12px;margin-top:8px">Missing (${missing.length})</div>${ch(missing, 'bad')}</div>
 <div class="c"><h2>Keyword analysis</h2><div class="mu" style="font-size:13px;margin-bottom:6px">Top JD terms — green found in resume, red missing</div>${kws.map(k => `<span class="chip ${k.has ? 'ok' : 'bad'}">${k.w} ×${k.n}</span>`).join('') || '<span class="mu">Not enough JD text</span>'}</div></div>` : '<p class="mu s">Add a job description to unlock the JD comparison, missing skills and keyword analysis.</p>'}
 <div class="c s"><h2>Improvement suggestions</h2><ul>${S.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
    $('res').scrollIntoView({ behavior: 'smooth' })
}
$('go').onclick = analyze;
