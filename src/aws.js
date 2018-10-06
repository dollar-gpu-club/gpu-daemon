import AWS from 'aws-sdk'
import moment from 'moment'
import { last, orderBy } from 'lodash'
// import uuid from 'uuid/v4'

import { getTimestamp } from './db'

// All GPU instance types on AWS. These prices are for Linux on us-east-1.
// See: https://aws.amazon.com/ec2/pricing/on-demand/
import instanceTypes from '../data/instances.json'

// All currently supported GPU instance types on AWS
export const supportedInstanceType = 'p2.xlarge'
export const supportedAvailabilityZone = 'us-east-1b'
export const supportedRegion = 'us-east-1'

// You can edit/launch templates here:
// https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#LaunchTemplates:sort=launchTemplateId
// const launchTemplateId = 'lt-0e2ec12442a6b8f4b'
// const launchTemplateVersion = '1'

// const POSTMAN_TESTING_JOB_ID = '12345'

// Enable native JS Promises
AWS.config.setPromisesDependency(null)
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
const ec2 = new AWS.EC2({ apiVersion: '2016-11-15', region: supportedRegion })

let spotInstancePriceHistory = []
let mockedPriceHistory = []

export function getOnDemandPrice() {
  return instanceTypes[supportedInstanceType].price
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotPriceHistory-property
export async function loadSpotPriceHistory() {
  // If we mocked the price history, we don't want to overwrite it with more recent data points.
  if (mockedPriceHistory.length > 0) return

  const data = await ec2
    .describeSpotPriceHistory({
      AvailabilityZone: supportedAvailabilityZone,
      InstanceTypes: [supportedInstanceType],
      DryRun: false,
      ProductDescriptions: ['Linux/UNIX'],
      StartTime: getTimestamp(moment().add(-7, 'days')),
      EndTime: getTimestamp()
    })
    .promise()

  const history = data.SpotPriceHistory || []

  spotInstancePriceHistory = orderBy(
    history.map(({ SpotPrice, Timestamp }) => ({
      price: Number(SpotPrice),
      ts: getTimestamp(Timestamp)
    })),
    'ts',
    'asc'
  )

  console.log(
    `Fetched spot instance price history. Current price: $${await getCurrentSpotPrice()} (${supportedAvailabilityZone}, ${supportedInstanceType})`
  )

  return spotInstancePriceHistory
}

export function getCurrentSpotPrice() {
  return last(getSpotInstancePriceHistory()).price
}

export function getSpotInstancePriceHistory() {
  return [...spotInstancePriceHistory, ...mockedPriceHistory]
}

export function addMockSpotInstancePrice(price) {
  mockedPriceHistory.push({
    price,
    ts: getTimestamp()
  })
}

export function clearMockedSpotInstancePrices() {
  mockedPriceHistory = []
}

// // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotFleetInstances-property
// export async function getInstances() {

// }

// async function bootInstance(job) {
//   // TODO: pass in user data as env variables
//   // Create an EC2 fleet
//   // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#createFleet-property
//   const { FleetId: fleetId } = await ec2.createFleet({
//     // DryRun: true,
//     LaunchTemplateConfigs: [
//       {
//         LaunchTemplateSpecification: {
//           LaunchTemplateId: launchTemplateId,
//           Version: launchTemplateVersion
//         },
//         Overrides: [
//           {
//             AvailabilityZone: supportedAvailabilityZone,
//             InstanceType: supportedInstanceType,
//             MaxPrice: job.thresholdPrice.toString(),
//           }
//         ]
//       }
//     ],
//     TargetCapacitySpecification: {
//       TotalTargetCapacity: 1,
//       DefaultTargetCapacityType: 'spot',
//       SpotTargetCapacity: 1
//     },
//     ClientToken: (job.id === POSTMAN_TESTING_JOB_ID ? uuid() : job.id),
//     ReplaceUnhealthyInstances: false,
//     SpotOptions: {
//       InstanceInterruptionBehavior: 'terminate'
//     },
//     Type: 'request'
//   }).promise()

//   console.log(`Submitted request to boot GPU instance: ${fleetId}`)

//   return fleetId
// }

// async function waitForFleetFulfilled(fleetId) {
//   const fleets = await ec2.describeFleets({
//     FleetIds: [ fleetId ]
//   }).promise()

//   const { FleetState: fleetState } = first(fleets)

//   console.log(fleets)
//   console.log(fleetState)
// }

// export async function startInstance(job) {
//   // Verify that we will be able to store a GPU instance at this price point.
//   if (job.thresholdPrice <= getCurrentSpotPrice()) {
//     console.log(`Threshold price for job ${job.id} not high enough (must be > ${getCurrentSpotPrice()})`)
//     return
//   }

//   const fleetId = await bootInstance(job)

//   await waitForFleetFulfilled(fleetId)

//   // // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#spotInstanceRequestFulfilled-waiter
//   // const bootedInstance = await ec2.waitFor('spotInstanceRequestFulfilled', {
//   //   SpotInstanceRequestIds: [ fleetId ]
//   // }).promise()

//   console.log(`Fleet Spot Request fulfilled: ${fleetId}`)
// }

// export async function stopInstance(id) {
//   // TODO: Stop GPU instance
//   // Maybe cancel stop request? and store the fleet id?
//   console.log(`TODO: stopping instance: ${id}`)
// }
