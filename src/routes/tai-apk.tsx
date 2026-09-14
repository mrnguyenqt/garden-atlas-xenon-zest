import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tai-apk")({
  beforeLoad: () => {
    throw redirect({ to: "/phien-ban" });
  },
  component: () => null,
});
