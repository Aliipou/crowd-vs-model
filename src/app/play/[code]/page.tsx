import { PlayClient } from "./PlayClient";

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PlayClient code={code.toUpperCase()} />;
}
