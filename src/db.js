import { find } from 'lodash'
import moment from 'moment'

import bootstrapData from '../data/init.json'

const data = bootstrapData

export const STATE = Object.freeze({
  PENDING: 'PENDING',
  // BOOTING: 'BOOTING',
  IN_PROGRESS: 'IN_PROGRESS',
  HALTED: 'HALTED',
  DONE: 'DONE',
  CANCELED: 'CANCELED'
})

export function getJob(id) {
  return find(data.jobs, j => j.id === id)
}

export function setJobState(id, newState) {
  const job = getJob(id)
  job.state = newState
  job.stateHistory.push({
    state: newState,
    ts: getTimestamp()
  })
}

export function getTimestamp(ts) {
  return (ts ? moment(ts) : moment()).toISOString()
}

export function getState() {
  return data
}
