"use client";
import { Fragment, useState } from "react";
import styles from "./gate.module.css";
import { useQuery } from "react-query";

type PairsData = {
  base: string,
  quote: string
  vol: number,
  trade_status: string,
};

export default function Gate() {
  const [selectedQuotes, setQuote] = useState<string[] | null>(null);
  const [format, setFormat] = useState<string>("GATEIO:{base}{quote}");
  const [copyBtnText, setCopyBtnText] = useState<"Copy" | "Copied!">("Copy");
  const [cleanLevTickers, setCleanLevTickers] = useState<boolean>(true);
  const [cleanNonTradable, setCleanNonTradable] = useState<boolean>(true);
  const [sortByVol, setSortByVol] = useState<boolean>(false);

  const { isLoading, error, data } = useQuery<PairsData[]>({
    queryKey: ["gate"],
    queryFn: async () => fetch('/api/gate').then(res => res.json()),
    cacheTime: Infinity,
  });

  if (isLoading) {
    return 'Loading...'
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
      if (a.quote === b.quote && sortByVol) {
        return b.vol - a.vol;
      }

      return a.quote.localeCompare(b.quote);
    })
    .map(x => format.replace("{base}", x.base).replace("{quote}", x.quote)) || [];

  let fileCount = Math.ceil(result.length / 999);

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