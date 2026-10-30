import "./DashboardBarChart.css";

const COLORS = [
  "#25805c",
  "#b47a20",
  "#167f83",
  "#a45c5c",
  "#526d94",
  "#bd5b2b",
  "#71823e",
  "#735a8e",
];

export default function DashboardBarChart({
  title,
  rows,
  emptyLabel,
  variant = "donut",
}) {
  const chartRows = rows.filter(([, value]) => value > 0);
  const total = chartRows.reduce((sum, [, value]) => sum + value, 0);
  let angle = 0;
  const segments = chartRows.map(([label, value], index) => {
    const start = angle;
    angle += (value / total) * 360;
    return `${COLORS[index % COLORS.length]} ${start}deg ${angle}deg`;
  });

  return (
    <section className="dashboard-chart" aria-label={title}>
      <h3>{title}</h3>
      {chartRows.length ? (
        <div className="dashboard-chart-content">
          <div
            className={`dashboard-chart-ring${variant === "pie" ? " is-pie" : ""}`}
            role="img"
            aria-label={`${title}: ${chartRows.map(([label, value]) => `${label}, ${value}`).join("; ")}`}
            style={{ background: `conic-gradient(${segments.join(", ")})` }}
          >
            {variant === "pie" ? null : (
              <div className="dashboard-chart-total">
                <strong>{total}</strong>
                <span>au total</span>
              </div>
            )}
          </div>
          {variant === "pie" && (
            <p className="dashboard-chart-summary">{total} au total</p>
          )}
          <ul className="dashboard-chart-legend">
            {chartRows.map(([label, value], index) => (
              <li key={label}>
                <span
                  className="dashboard-chart-swatch"
                  style={{ "--chart-color": COLORS[index % COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="dashboard-chart-label">{label}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>{emptyLabel}</p>
      )}
    </section>
  );
}
