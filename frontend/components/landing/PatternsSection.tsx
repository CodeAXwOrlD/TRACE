import { NeonText } from "@/components/neon/NeonText";

const patterns = [
  { title: "Card testing", desc: "Three or more tiny online authorizations within about an hour, then a larger purchase." },
  { title: "Card-not-present fraud", desc: "A burst of online purchases that does not fit what this card normally does." },
  { title: "Card-not-present with a new device", desc: "The same behaviour, and the identity record shows a device never seen on this card." },
  { title: "Out of region", desc: "In-person use in a new billing region while normal home activity carries on." },
  { title: "Account takeover", desc: "Mixed channels with identity, device or match signals that suggest stolen credentials." },
  { title: "Undocumented", desc: "Coordinated abuse that matches none of the above. It is reported as exactly that." },
];

export function PatternsSection() {
  return (
    <section className="sec" id="patterns">
      <div className="wrap">
        <p className="label rv">WHAT TRACE LOOKS FOR</p>
        <NeonText
          as="h2"
          className="title neon-title"
          fontSize={64}
          ariaLabel="Five known patterns, and one for the rest."
          lines={[
            { text: "Five known patterns,", tone: "ice" },
            { text: "and one for the rest.", tone: "fire" },
          ]}
        />
        <div className="plist">
          {patterns.map((p) => (
            <div className="pi rv" key={p.title}>
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
