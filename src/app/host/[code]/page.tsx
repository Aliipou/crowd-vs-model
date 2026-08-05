import { HostClient } from "./HostClient";

export default async function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <HostClient code={code.toUpperCase()} />;
}
