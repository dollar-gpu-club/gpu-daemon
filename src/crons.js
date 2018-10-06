import cron from 'node-cron'

// import { STATE, getState, setJobState } from './db';
import { loadSpotPriceHistory } from './aws'

function schedule({ name, freq, fn, runImmediately = false }) {
  const execWrapper = () => {
    console.log(`Executing task: ${name} (${freq})`)
    fn()
  }

  cron.schedule(freq, execWrapper)

  if (runImmediately) execWrapper()
}

const crons = () => {
  console.log('Initializing cronjobs...')

  // Every 5 seconds.
  // schedule({
  // 	name: 'Poll Jobs',
  // 	freq: '*/10 * * * * *',
  // 	fn: pollJobs,
  // 	runImmediately: true
  // });

  schedule({
    name: 'Load Spot Price History',
    freq: '0 * * * * *',
    fn: loadSpotPriceHistory,
    runImmediately: true
  })
}

// const pollJobs = async () => {
// 	const { jobs } = getState();

// 	// TODO: check instances for halted jobs
// 	// const haltedJobs = haltedInstances().map(i => find(instances, inst => inst.))

// 	const startableJobs = jobs.filter((j) => j.state === STATE.PENDING || j.state === STATE.HALTED);
// 	if (startableJobs.length > 0) {
// 		console.log(`Starting ${startableJobs.length} jobs...`);

// 		await Promise.all(startableJobs.map(async job => {
//       setJobState(job.id, STATE.BOOTING)
//       await startInstance(job)
//     }));

// 		console.log('Done starting jobs.');
// 	}
// };

export default crons
