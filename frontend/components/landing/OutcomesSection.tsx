import { NeonText } from "@/components/neon/NeonText";

export function OutcomesSection() {
  return (
    <section className="sec" id="outcomes">
      <div className="wrap">
        <p className="label rv">THREE OUTCOMES</p>
        <NeonText
          as="h2"
          className="title neon-title"
          fontSize={64}
          ariaLabel="Block it, clear it, or ask a person."
          lines={[
            { text: "Block it, clear it,", tone: "ice" },
            { text: "or ask a person.", tone: "fire" },
          ]}
        />
        <p className="lead rv">
          Blocking everything scores badly, because half of flagged cases are legitimate. TRACE is as confident
          closing a case as it is blocking one.
        </p>
        <div className="trio">
          <article className="oc f rv">
            <span className="pill fraud">Confirmed pattern</span>
            <h3>Fraud</h3>
            <p>Shared device, connected fraud cases and a customer denial.</p>
            <div className="acts">
              <span className="act">BLOCK_CARD</span>
              <span className="act">FILE_REPORT</span>
              <span className="act">MONITOR_CONNECTED_CARDS</span>
            </div>
          </article>
          <article className="oc l rv">
            <span className="pill legit">Low concern</span>
            <h3>Legitimate</h3>
            <p>Recurring behaviour on a known device. Similar past cases were cleared.</p>
            <div className="acts">
              <span className="act">CLOSE_NO_FRAUD</span>
            </div>
          </article>
          <article className="oc u rv">
            <span className="pill unsure">Evidence incomplete</span>
            <h3>Uncertain</h3>
            <p>The evidence conflicts and exposure is $842, so a person decides.</p>
            <div className="acts">
              <span className="act">ESCALATE_TO_ANALYST</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
