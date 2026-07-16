import { NextApiRequest, NextApiResponse } from 'next'

// Simple placeholder that returns the next race data from Ergast API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch('https://ergast.com/api/f1/current/race.json')
    const data = await response.json()
    // Cache for 30 minutes using HTTP headers
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate')
    res.status(200).json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch calendar' })
  }
}
