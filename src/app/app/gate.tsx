"use client";
import { Fragment, useState } from "react";
import styles from "./gate.module.css";
import { useQuery } from "react-query";
import throttledQueue from "throttled-queue";

const queue = throttledQueue(2, 1000);

type PairsData = {
  id: string,
  base: string,
  quote: string,
  trade_status: string
  vol?: number
};

export default function Gate() {
  const [selectedQuotes, setQuote] = useState<string[] | null>(null);
  const [format, setFormat] = useState<string>("GATEIO:{base}{quote}");
  const [copyBtnText, setCopyBtnText] = useState<"Copy" | "Copied!">("Copy");
  const [cleanLevTickers, setCleanLevTickers] = useState<boolean>(true);
  const [cleanNonTradable, setCleanNonTradable] = useState<boolean>(true);
  const [sortByVol, setSortByVol] = useState<boolean>(false);
  const [fetchRunning, setFetchRunning] = useState<boolean>(false);
  const [prog, setProg] = useState<[number, number]>([1, 1]);

  const { isLoading, error, data } = useQuery({
    queryKey: ["gate"],
    queryFn: async () => {
      let pairsResponse = await fetch('/api/gate').then(res => res.json()) as PairsData[];
      let { volumes } = await fetchVolumes(setProg, setFetchRunning);

      return pairsResponse.map((x) => {
        let vol = volumes.find((dv: any) => dv.pair === `${x.base}_${x.quote}`)?.volume;

        return {
          ...x,
          vol: Number(vol || "0")
        }
      })
    },
    cacheTime: Infinity,
  });

  if (isLoading) {
    if (fetchRunning) {
      return `Loading volumes: ${prog[0]} of ${prog[1]}`
    } else {
      return 'Loading...'
    }
  };
  if (error || !data) return 'Error';

  let allQuotes = [...new Set(data.map(x => x.quote))];
  if (selectedQuotes === null) {
    setQuote([...allQuotes]);
    return 'Loading...';
  }

  let result = data
    .filter(x => selectedQuotes && selectedQuotes.includes(x.quote))
    .filter(x => cleanLevTickers ? !x.base.endsWith("3L") && !x.base.endsWith("3S") && !x.base.endsWith("5L") && !x.base.endsWith("5S") : true)
    .filter(x => cleanNonTradable ? x.trade_status === "tradable" : true)
    .sort((a, b) => {
      if (sortByVol) {
        return (b.vol || 0) - (a.vol || 0)
      } else {
        return a.base > b.base ? 1 : -1;
      }
    })
    .map(x => format.replace("{base}", x.base).replace("{quote}", x.quote)) || [];

  return (
    <div className={styles.page}>
      <div>
        <b>Quote:</b>
        <div>
          {allQuotes.map(q => {
            return (
              <Fragment key={q}>
                <label>
                  <input type="checkbox" checked={selectedQuotes.includes(q)} value={q} onChange={(e) =>
                    setQuote(e.target.checked ?
                      [...(selectedQuotes || []), q] :
                      (selectedQuotes || []).filter(x => x !== q))}
                  ></input> {q}
                </label>
                <br />
              </Fragment>
            )
          })}
        </div>
      </div>
      <div>
        <b>Cleanup options:</b>
        <div>
          <label>
            <input type="checkbox" checked={cleanLevTickers} onChange={(e) => setCleanLevTickers(e.target.checked)}></input>
            Clean 3L/3S/5L/5S tickers
          </label>
          <br></br>
          <label>
            <input type="checkbox" checked={cleanNonTradable} onChange={(e) => setCleanNonTradable(e.target.checked)}></input>
            Clean non tradable tokens
          </label>
        </div>
      </div>
      <div>
        <b>Format:</b>
        <div>
          <input type="text" placeholder="set output format" onChange={(e) => setFormat(e.target.value)} value={format}></input>
        </div>
      </div>
      <div>
        <b>Sort:</b>
        <div>
          <label>
            <input type="checkbox" checked={sortByVol} onChange={(e) => setSortByVol(e.target.checked)}></input>
            Sort by volume
          </label>
          <br></br>
          {fetchRunning && <label>Fetching volume data: ${prog[0]} of ${prog[1]}</label>}
        </div>
      </div>
      <div>
        <b>Output:</b>
        <div>
          <div className={styles.btns}>
            <button onClick={(btn) => {
              let el = document.createElement("input");
              el.value = result.join(";");
              el.select();
              el.setSelectionRange(0, 99999);
              navigator.clipboard.writeText(el.value.split(";").join("\n"));
              setCopyBtnText("Copied!")
              setTimeout(() => setCopyBtnText("Copy"), 5000);
            }}>{copyBtnText}</button>
            <button onClick={() => {
              let link = document.createElement('a');
              link.href = 'data:text/plain;charset=UTF-8,' + result.join("\n");
              link.download = `output.txt`;
              link.click();
            }}>{`Export to .txt (1 file)`}</button>
            <button onClick={() => {
              for (let i = 0; i < result.length; i += 999) {
                let batch = result.slice(i, i + 999);
                let link = document.createElement('a');
                link.href = 'data:text/plain;charset=UTF-8,' + batch.join("\n");
                link.download = `output${i + 1}-${i + batch.length}.txt`;
                link.click();
              }
            }}>{`Export to .txt (${Math.ceil(result.length / 999)} files)`}</button>
          </div>
          <textarea spellCheck={false} cols={30} rows={50} value={result.join("\n")} readOnly></textarea>
        </div>
      </div>
    </div>
  );
}

async function fetchVolumes(
  setProg: (p: [number, number]) => void,
  setFetchRunning: (p: boolean) => void
) {
  let volumesStatus = "";
  do {
    let volResp: any;
    let volRespOk: boolean = false;

    //try fetch from server
    try {
      let resp = await fetch('/api/gate_volumes');
      volResp = await resp.json();
      volRespOk = resp.ok;
      volumesStatus = volResp?.status;
    } catch (e) { console.log(e) }

    if (volumesStatus === "FETCHING") {
      setFetchRunning(true);
      setProg(volResp.progress);
      await new Promise(res => setTimeout(res, 3000));
    }
    //if server failed try fetch on client
    else if (volumesStatus === "ERROR" || !volRespOk) {
      setFetchRunning(false);
      try {
        let volumes = await fetchVolumesOnClient(setProg, setFetchRunning);
        return volumes;
      } catch (e) {
        console.log(e);
        return;
      }
    }
    else if (volumesStatus === "OK") {
      setFetchRunning(false);
      return volResp;
    }
  }
  while (volumesStatus === "FETCHING")
}

async function fetchVolumesOnClient(
  setProgress: (prog: [number, number]) => void,
  setRunning: (r: boolean) => void
) {
  setRunning(true);
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
      return Promise.reject(response.message);
    }

    result.push(...response.data.list.flatMap((l: any) => {
      return l.trade_market.map((tm: any) => ({
        pair: tm.pair,
        volume: Number(l.volume_24h || "0")
      }))
    }))

    total = response.data.totalCount;
    page++;
    setProgress([page, Math.ceil(total / pageSize)]);
    console.log([page, Math.ceil(total / pageSize)]);
  } while (page * pageSize < total);

  setRunning(false);
  return result;
}