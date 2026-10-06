import {runEvaluations} from '../../public/ai-lab/cases.mjs';
import {datasetVersion,policyVersion} from '../../public/ai-lab/core.mjs';
const results=runEvaluations();
console.log(JSON.stringify({timestamp:new Date().toISOString(),scope:'deterministic-only',datasetVersion,policyVersion,passed:results.filter(r=>r.passed).length,total:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
