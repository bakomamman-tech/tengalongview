import fs from 'node:fs';
const p='./data/synthetic/learner-records.json';
const data=JSON.parse(fs.readFileSync(p,'utf8'));
if(!data.learners.every(x=>x.synthetic===true)) throw new Error('All demo learners must be marked synthetic.');
const ids=new Set();
for(const e of data.evidence){if(ids.has(e.id)) throw new Error('Duplicate evidence id '+e.id);ids.add(e.id)}
console.log(`Static checks passed: ${data.learners.length} synthetic learners, ${data.evidence.length} evidence records, ${ids.size} unique evidence IDs.`);
