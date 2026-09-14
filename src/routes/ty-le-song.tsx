import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ty-le-song")({
  beforeLoad: () => {
    throw redirect({ to: "/o-mau/o-tieu-chuan" });
  },
});
