import { LiveScreen } from "./LiveScreen";
import { DemoScreen } from "./DemoScreen";

export default async function ScreenPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { code } = await params;
  const { demo } = await searchParams;
  const upper = code.toUpperCase();
  return demo === "1" ? <DemoScreen code={upper} /> : <LiveScreen code={upper} />;
}
