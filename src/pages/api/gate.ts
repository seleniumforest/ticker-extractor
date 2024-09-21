import { NextApiRequest, NextApiResponse } from "next";
import Big from "big.js";

export default async function handler(_: NextApiRequest, response: NextApiResponse) {
    let [pairs, market]: [
        pairs: {
            base: string,
            quote: string,
            trade_status: string,
        }[],
        market: {
            data:
            {
                curr_a: string,
                curr_b: string,
                vol_a: string,
                high: string,
                low: string
            }[]
        }
    ] = await Promise.all([
        fetch(
            "https://api.gateio.ws/api/v4/spot/currency_pairs",
            { headers: { 'Content-Type': 'application/json' } }
        ).then(x => x.json()),
        fetch(
            "https://data.gateapi.io/api2/1/marketlist",
            { headers: { 'Content-Type': 'application/json' } }
        ).then(x => x.json())
    ]);

    let result = pairs.map(p => {
        let volume = 0;
        let toUsdtPrice = market.data.find(x => x.curr_a.toLowerCase() === p.base.toLowerCase() && x.curr_b.toLowerCase() === "usdt");

        if (toUsdtPrice) {
            volume = Big(toUsdtPrice.vol_a).mul(Big(toUsdtPrice.high).plus(toUsdtPrice.low).div(2)).toNumber();
        }

        return {
            trade_status: p.trade_status,
            base: p.base,
            quote: p.quote,
            vol: volume
        }
    });

    response.setHeader('Cache-Control', 'max-age=86400, s-maxage=86400');
    return response.status(200).json(result);
}