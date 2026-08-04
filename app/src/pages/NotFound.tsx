import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-foreground">Market not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That page doesn't exist — or the market already resolved.</p>
      <Link to="/" className="mt-6">
        <Button className="glow-gold">Back to all markets</Button>
      </Link>
    </div>
  );
}
