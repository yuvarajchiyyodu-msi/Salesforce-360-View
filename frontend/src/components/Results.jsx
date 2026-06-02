import Summary from "./Summary.jsx";
import OrgCard from "./OrgCard.jsx";

const ORG_META = {
  LMRUATOrg: {
    label: "MCN / LMR",
    note: "Land Mobile Radio · Sales + Service Cloud · channel-driven, government-heavy. No CPQ / Revenue Cloud — quote-to-cash is manual; contracts via Adobe Sign.",
  },
  VSAUATOrg: {
    label: "VS&A",
    note: "Video surveillance · full Quote-to-Cash. CPQ quotes & subscriptions (ARR), Revenue Cloud billing, orders & invoices, B2B Commerce.",
  },
};

export default function Results({ summary, events }) {
  if (!summary) return null;

  const counts = events.reduce((acc, e) => {
    if (e.type === "tool_call" && e.org) acc[e.org] = (acc[e.org] ?? 0) + 1;
    return acc;
  }, {});

  const orgs = ["LMRUATOrg", "VSAUATOrg"].map((alias) => ({
    alias,
    label: ORG_META[alias].label,
    note: ORG_META[alias].note,
    queryCount: counts[alias] ?? 0,
  }));

  return (
    <div className="space-y-5">
      <Summary text={summary} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map((org) => (
          <OrgCard key={org.alias} org={org} />
        ))}
      </div>
    </div>
  );
}
