import { Hammer } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/routes/nav";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/States";
export default function ComingSoon() {
  const { pathname } = useLocation(); const item = NAV_ITEMS.find((n) => n.to === pathname);
  return (<><PageHeader title={item?.label ?? "Page"} /><EmptyState icon={Hammer} title="This module is built in a later step" description="Navigation, guards and data services are already wired for it." /></>);
}
