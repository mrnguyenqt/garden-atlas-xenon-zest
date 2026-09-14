import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DIEU_TRA_PREFIXES = ["/o-mau", "/du-an", "/ty-le-song", "/xuat-csv"];

export function isDieuTraPath(pathname: string) {
  return DIEU_TRA_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function BackToDieuTra() {
  return (
    <Button asChild className="mb-3">
      <Link to="/o-mau">
        <ArrowLeft />
        Điều tra rừng
      </Link>
    </Button>
  );
}
