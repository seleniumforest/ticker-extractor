import { NextApiRequest, NextApiResponse } from "next";
import throttledQueue from "throttled-queue";
import NodeCache from "node-cache";

const cache = new NodeCache({
    stdTTL: 86400,
    deleteOnExpire: true
});
const queue = throttledQueue(20, 5000);
let status: "FETCHING" | "ERROR" | "OK" | "READY_TO_FETCH" = "READY_TO_FETCH";
let fetchProgress: [number, number] = [1, 1];

export default async function handler(_: NextApiRequest, response: NextApiResponse) {
    if (status === "OK" && cache.has("volumes")) {
        let volumes = cache.get<{
            pair: string,
            volume: number
        }[]>("volumes")!;

        response.setHeader('Cache-Control', 'max-age=86400, s-maxage=86400');
        status = "OK";
        return response.status(200).json({
            status,
            volumes
        });;
    } else if (status === "ERROR") {
        return response.status(200).json({
            status
        });
    } else if (status === "FETCHING") {
        return response.status(200).json({
            status,
            progress: fetchProgress
        });
    } else {
        fetchVolumes();
        return response.status(200).json({
            status,
            progress: fetchProgress
        });
    }
}

async function fetchVolumes() {
    if (status === "FETCHING")
        return;

    status = "FETCHING";
    let page = 1;
    let pageSize = 50;
    let total = 0;
    let result: {
        pair: string,
        volume: number
    }[] = [];

    do {
        let response = await queue(() => fetch("https://www.gate.io/api-price/api/inner/v2/price/getAllCoinList", {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `is_gate=1000001&tab=trade&page=${page}&pageSize=${pageSize}`
        }).then(x => x.json()));

        if (response.message != "success") {
            status = "ERROR";
            return Promise.reject(response.message);
        }

        result.push(...response.data.list.flatMap((l: any) => {
            return l.trade_market.map((tm: any) => ({
                pair: tm.pair,
                volume: Number(l.volume_24h || "0")
            }))
        }))

        total = response.data.totalCount;
        fetchProgress = [page, Math.ceil(total / pageSize)];
        page++;
        console.log([page, Math.ceil(total / pageSize)]);
    } while (page * pageSize < total);
    cache.set("volumes", result);
    status = "OK";
    return result;
}