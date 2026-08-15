import { auditMultiPathRuinsV1 } from '../src/experiments/multi-path-ruins-v1/auditor';

const result = auditMultiPathRuinsV1();
console.log(JSON.stringify(result, null, 2));
