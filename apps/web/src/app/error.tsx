"use client";

import { useEffect } from "react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card title="Unexpected error" subtitle="This route failed to render.">
      <p className="muted">{error.message}</p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </Card>
  );
}
