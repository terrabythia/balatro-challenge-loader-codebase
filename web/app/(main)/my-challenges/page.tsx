import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function MyChallengesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Challenges</h1>
        <p className="mt-2 text-sm text-white/40">
          Your drafts and published challenges.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center text-sm text-white/20">
        Your challenge list coming soon.
      </div>
    </div>
  );
}
