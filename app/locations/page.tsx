import Link from "next/link";
import { listLocations } from "@/lib/locations";
import { LocationMapList } from "./LocationMapList";

export const metadata = {
  title: "访客位置",
  description: "查看已记录的位置信息",
};

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const records = await listLocations();

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-rose-100">访客位置</h1>
            <p className="mt-1 text-xs text-neutral-400">
              首页点击底部按钮并允许定位后记录（同一会话成功一次后不再提示）
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-sm text-rose-200/90 hover:bg-white/5"
          >
            返回首页
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <LocationMapList initialRecords={records} />
      </main>
    </div>
  );
}
