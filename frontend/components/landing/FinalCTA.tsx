import { NeonText } from "@/components/neon/NeonText";

export function FinalCTA() {
  return (
    <>
      <section className="final">
        <NeonText
          as="h2"
          className="title neon-title"
          fontSize={76}
          align="center"
          ariaLabel="Make the next decision defensible."
          lines={[
            { text: "Make the next decision", tone: "ice" },
            { text: "defensible.", tone: "fire" },
          ]}
        />
        <p>From an uncertain signal to an action you can explain, with every step of the evidence attached.</p>
        <a className="btn" href="#how">
          Explore an investigation
        </a>
      </section>
      <footer className="site-footer">Design preview with sample data. Case IDs, card numbers and policy names are placeholders.</footer>
    </>
  );
}
