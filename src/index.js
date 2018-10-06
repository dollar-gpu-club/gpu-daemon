import cron from 'node-cron'
import request from 'request-promise-native'

import shell from 'shelljs'

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

  schedule({
    name: 'Load Job State',
    freq: '*/10 * * * * *',
    fn: run,
    runImmediately: true
  })
}

async function getState() {
  return JSON.parse(
    await request.get('https://dollar-gpu-club-api.herokuapp.com/state')
  ).state
}

async function startJob(job) {
  const aBadIdea = `JOB_ID=${job.id} ${job.command}`
  console.log(aBadIdea)
  shell.exec(aBadIdea)
}

const run = async () => {
  const state = await getState()
  const { jobs } = state

  const startableJobs = jobs.filter(
    j => j.state === 'PENDING' || j.state === 'HALTED'
  )
  if (startableJobs.length > 0) {
    console.log(`Starting ${startableJobs.length} jobs...`)

    await Promise.all(
      startableJobs.map(async job => {
        await startJob(job)
      })
    )

    console.log('Done starting jobs.')
  } else {
    console.log('No startable jobs found.')
  }
}

console.log('Running daemon...')
crons()
