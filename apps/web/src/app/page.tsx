import Link from "next/link";

import { Card } from "../components/ui/card";

const routes = ["/login", "/register", "/tools", "/tools/[toolSlug]", "/tools/[toolSlug]/execute", "/admin", "/admin/tools"];

export default function HomePage() {
  return (
    <div className="stack">
      <header className="page-header">
        <h1 className="page-title">Frontend Shell Ready</h1>
        <p className="page-subtitle">
          Next.js app router baseline with auth skeleton, catalog flows, and admin area scaffolding.
        </p>
      </header>

      <Card title="Start here" subtitle="Auth pages, route guards, and catalog execution flows are available.">
        <p>
          <Link href="/login" className="inline-link">
            Open login flow
          </Link>
        </p>
      </Card>

      <Card title="Implemented routes">
        <ul className="list-reset stack">
          {routes.map((route) => (
            <li key={route}>
              <code>{route}</code>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
