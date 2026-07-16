import { NextApiRequest, NextApiResponse } from 'next'

// Proxy to the FastF1 /live endpoint deployed on Render (or similar service)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { season, round } = req.query as { season?: string; round?: string }
  if (!season || !round) {
    return res.status(400).json({ error: 'Missing season or round' })
  }
  try {
    const fastf1Url = process.env.FASTF1_URL
    if (!fastf1Url) throw new Error('FASTF1_URL not set in environment')
    const url = `${fastf1Url}/live?season=${season}&round=${round}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`FastF1 responded ${response.status}`)
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate')
    res.status(200).json(data)
  } catch (e: any) {
    console.error(e)
    res.status(502).json({ error: 'Live data unavailable' })
  }
}
