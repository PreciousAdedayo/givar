import { prisma } from "@/lib/prisma";
import { PageHead } from "@/components/admin/ui";
import ApkUploadForm from "@/components/admin/ApkUploadForm";
import ReleasePublishButton from "@/components/admin/ReleasePublishButton";
export const metadata = { title: "Android app" };
export const dynamic = "force-dynamic";
const size = (n: number) => n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
export default async function AdminAppPage() {
  const releases = await prisma.appRelease.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return <div className="space-y-5"><PageHead title="Android app releases" desc="Upload, publish and manage APK builds shown on the public download page."/><ApkUploadForm/><section className="glass rounded-2xl p-5"><h2 className="mb-3 font-semibold">Release history</h2>{!releases.length ? <p className="text-sm text-[var(--mut)]">No APK releases uploaded yet.</p> : <ul className="divide-y divide-[var(--line)]">{releases.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold">Version {r.version} {r.published && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-500">Live</span>}</p><p className="text-xs text-[var(--mut)]">{r.fileName} · {size(r.fileSize)} · {r.createdAt.toLocaleDateString()}</p></div><div className="flex items-center gap-2"><a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs underline">Open file</a><ReleasePublishButton id={r.id} published={r.published}/></div></li>)}</ul>}</section></div>;
}
