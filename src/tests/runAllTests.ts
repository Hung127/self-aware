import { getInitialSampleTasks, getInitialSampleSleepRecords, DEFAULT_SETTINGS } from '../utils/storage';
import { runSystemValidationSuite } from '../utils/validationSuite';

console.log('----------------------------------------------------');
console.log('PERSONAL CALIBRATION - FULL SUITE EXECUTION');
console.log('----------------------------------------------------');

const tasks = getInitialSampleTasks();
const sleep = getInitialSampleSleepRecords();
const settings = DEFAULT_SETTINGS;

const results = runSystemValidationSuite(tasks, sleep, settings);
let passed = 0;
let failed = 0;

results.forEach((test, idx) => {
  const symbol = test.passed ? '✓ PASS' : '✗ FAIL';
  const color = test.passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}[${symbol}]${reset} Test ${idx + 1}: ${test.name}`);
  console.log(`         Details: ${test.details}\n`);

  if (test.passed) passed++;
  else failed++;
});

console.log('----------------------------------------------------');
console.log(`TOTAL RESULT: ${passed}/${results.length} PASSED (${Math.round((passed / results.length) * 100)}% Pass Rate)`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All unit & functional edge-case tests passed successfully!');
  process.exit(0);
}
