import { Card } from "../components/ui/card";

export default function Loading() {
  return (
    <Card title="Loading page" subtitle="Fetching the latest data for this view.">
      <p className="muted">Please wait...</p>
    </Card>
  );
}
