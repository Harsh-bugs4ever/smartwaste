import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <div className="grid min-h-screen place-items-center"><EmptyState title="Page not found" description="The address doesn’t match any SmartWaste page." action={<Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>} /></div>;
}
