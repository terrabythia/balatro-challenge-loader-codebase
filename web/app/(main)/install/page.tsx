export default function InstallPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Install the Mod</h1>
      <p className="mt-2 text-sm text-white/40">
        Get the Challenge Loader mod to play hub challenges in Balatro.
      </p>

      <div className="mt-10 space-y-8">
        <Step number={1} title="Install Steamodded">
          <p className="text-sm leading-relaxed text-white/60">
            Challenge Loader requires Steamodded, the modding framework for
            Balatro. Follow the installation guide on the{" "}
            <a
              href="https://github.com/Steamodded/smods/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Steamodded Wiki
            </a>
            .
          </p>
        </Step>

        <Step number={2} title="Download the mod">
          <p className="text-sm leading-relaxed text-white/60">
            Click the button below to download the latest version of the
            Challenge Loader mod.
          </p>
          <a
            href="/api/download-mod"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download challenge-loader-mod.zip
          </a>
        </Step>

        <Step number={3} title="Install the mod">
          <p className="text-sm leading-relaxed text-white/60">
            Extract the downloaded zip into your Balatro mods folder:
          </p>
          <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
            <code className="text-xs text-white/50">
              {PLATFORM_PATHS[getPlatform()]}
            </code>
          </div>
          <p className="mt-2 text-xs text-white/30">
            The final path should look like{" "}
            <code className="text-white/40">
              .../Mods/challenge-loader/main.lua
            </code>
          </p>
        </Step>

        <Step number={4} title="Launch and play">
          <p className="text-sm leading-relaxed text-white/60">
            Start Balatro, open the <strong>Challenges</strong> tab, and click{" "}
            <strong>Load Hub Challenge</strong>. Enter a code from the Explore
            page to play!
          </p>
        </Step>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
        {number}
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function getPlatform(): keyof typeof PLATFORM_PATHS {
  return "macOS / Linux";
}

const PLATFORM_PATHS = {
  Windows: "%appdata%\\Balatro\\Mods",
  "macOS / Linux":
    "~/Library/Application Support/Balatro/Mods",
};
