const rows = [
  { id: "CASE-0007", tone: "fraud" as const, pill: "Fraud", risk: 87, prob: 82, note: "Shared device with two confirmed cases." },
  { id: "CASE-0012", tone: "legit" as const, pill: "Legitimate", risk: 91, prob: 9, note: "Known device, recurring purchase, three similar cleared cases." },
  { id: "CASE-0019", tone: "unsure" as const, pill: "Uncertain", risk: 58, prob: 51, note: "Evidence conflicts and exposure is $842, so an analyst decides." },
];

export function ScoreSection() {
  return (
    <section className="sec" id="score">
      <div className="wrap two">
        <div>
          <p className="label rv">SCORE VERSUS EVIDENCE</p>
          <h2 className="sec-title rv">
            <span>A high score </span>
            <span className="highlight">is not a verdict.</span>
          </h2>
          <p className="lead rv">
            Many transactions above 0.7 are legitimate, and some fraud hides behind a low score. TRACE uses the risk
            score as <b>one input</b>, then weighs behaviour, device, card history, connected cards, billing region
            and past cases before it says how likely fraud is.
          </p>
        </div>
        <div className="cmp">
          {rows.map((r) => (
            <div className="crow rv" data-tone={r.tone} key={r.id}>
              <div className="chead">
                <b>{r.id}</b>
                <span className={`pill ${r.tone}`}>{r.pill}</span>
              </div>
              <div className="bl">
                <span>Risk score</span>
                <div className="bar">
                  <i className="risk-f" style={{ ["--w" as any]: `${r.risk}%` }} />
                </div>
                <output>{(r.risk / 100).toFixed(2)}</output>
              </div>
              <div className="bl">
                <span>Fraud probability</span>
                <div className="bar">
                  <i className="prob-f" style={{ ["--w" as any]: `${r.prob}%` }} />
                </div>
                <output>{(r.prob / 100).toFixed(2)}</output>
              </div>
              <p>{r.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
