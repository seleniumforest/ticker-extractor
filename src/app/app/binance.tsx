"use client";
import { Fragment, useState } from "react";
import styles from "./binance.module.css";
import { useQuery } from "react-query";

type TickerData = {
  symbol: string,
  baseAsset: string,
  quoteAsset: string,
  status: string,
  isSpotTradingAllowed: boolean
};

type VolumeData = {
  symbol: string,
  quoteVolume: string
}

export default function Binance() {
  const [selectedQuotes, setQuote] = useState<string[] | null>(null);
  const [format, setFormat] = useState<string>("BINANCE:{base}{quote}");
  const [copyBtnText, setCopyBtnText] = useState<"Copy" | "Copied!">("Copy");
  const [cleanNonTradable, setCleanNonTradable] = useState<boolean>(true);
  const [sortByVol, setSortByVol] = useState<boolean>(true);

  const { isLoading, error, data, } = useQuery<(TickerData & { quoteVolume: number })[]>({
    queryKey: ["binance"],
    queryFn: async () => {
      return Promise.all([
        fetch('https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT').then(res => res.json()).then(res => res.symbols),
        fetch('https://api.binance.com/api/v3/ticker/24hr').then(res => res.json())
      ])
        .then(([tickerData, volumeData]: [tickerData: TickerData[], volumeData: VolumeData[]]) => {
          return tickerData.map(t => ({
            ...t,
            quoteVolume: Number(volumeData.find(v => v.symbol === t.symbol)?.quoteVolume || "0")
          }))
        })
    },
    cacheTime: Infinity
  });

  if (isLoading) return 'Loading...';
  if (error || !data) return 'Error...';

  let allQuotes = [...new Set(data.map(x => x.quoteAsset))];
  if (selectedQuotes === null) {
    setQuote([...allQuotes]);
    return 'Loading...';
  }

  let result = data
    .filter(x => selectedQuotes && selectedQuotes.includes(x.quoteAsset))
    .filter(x => cleanNonTradable ? x.status === "TRADING" : true)
    .sort((a, b) => {
      if (a.quoteAsset === b.quoteAsset && sortByVol) {
        return b.quoteVolume - a.quoteVolume;
      }

      return a.quoteAsset.localeCompare(b.quoteAsset);
    })
    .map(x => format.replace("{base}", x.baseAsset).replace("{quote}", x.quoteAsset)) || [];

  let fileCount = Math.ceil(result.length / 999);

  return (
    <div className={styles.page}>
      <div className={styles.quote}>
        <b>Quote:</b>
        <br />
        <button onClick={() => {
          setQuote([]);
        }}>Clear all</button>
        <button onClick={() => {
          setQuote([...allQuotes]);
        }}>Select all</button>
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
            Sort by quote volume
          </label>
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
            }}>{`Export to .txt`}</button>
            {fileCount > 1 && (
              <button onClick={() => {
                for (let i = 0; i < result.length; i += 999) {
                  let batch = result.slice(i, i + 999);
                  let link = document.createElement('a');
                  link.href = 'data:text/plain;charset=UTF-8,' + batch.join("\n");
                  link.download = `output${i + 1}-${i + batch.length}.txt`;
                  link.click();
                }
              }}>{`Export to ${Math.ceil(result.length / 999)} .txt files, split by 1000 items`}</button>
            )}
          </div>
          <textarea spellCheck={false} cols={30} rows={50} value={result.join("\n")} readOnly></textarea>
        </div>
      </div>
    </div>
  );
}