import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_: NextApiRequest, response: NextApiResponse) {
    let pairs = await fetch(
        "https://api.gateio.ws/api/v4/spot/currency_pairs",
        { headers: { 'Content-Type': 'application/json' } }
    ).then(x => x.json())

    response.setHeader('Cache-Control', 'max-age=86400, s-maxage=86400');
    return response.status(200).json(pairs);
}