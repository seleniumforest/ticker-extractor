import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    console.log("req")
    const res = await fetch('https://api.gateio.ws/api/v4/spot/currency_pairs', {
        headers: {
            'Content-Type': 'application/json'
        },
    })
    const data = await res.json();

    response.setHeader('Cache-Control', 'max-age=3600, s-maxage=3600');
    return response.status(200).json(data);
}