const routes = [
  "/login",
  "/tools",
  "/tools/[toolSlug]",
  "/tools/[toolSlug]/execute",
  "/admin/tools"
];

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", lineHeight: 1.6 }}>
      <h1>HyperZ Tools</h1>
      <p>Monorepo scaffold baseline for the internal developer tools platform.</p>
      <h2>Planned routes</h2>
      <ul>
        {routes.map((route) => (
          <li key={route}>{route}</li>
        ))}
      </ul>
    </main>
  );
}
