import Section from "./Section";
import Tilt from "./Tilt";
import { useAsset } from "../lib/useAsset";
import { track } from "../lib/analytics";

const VIDEO_URL = "/video/promo.mp4";
const POSTER_URL = "/video/poster.jpg";

export default function VideoSection() {
  const hasVideo = useAsset(VIDEO_URL);
  const hasPoster = useAsset(POSTER_URL);

  return (
    <Section id="video" title="Intro video" eyebrow="02 / Showreel" tone="page">
      <Tilt className="overflow-hidden rounded-[18px] border border-line bg-black shadow-[0_40px_90px_color-mix(in_srgb,var(--p1)_45%,transparent)]" max={4}>
        {hasVideo ? (
          <video
            className="aspect-video w-full bg-black"
            controls
            preload="metadata"
            playsInline
            poster={hasPoster ? POSTER_URL : undefined}
            onPlay={() => track("video_play")}
            aria-label="Promotional video introducing Samrah Niazi and this portfolio"
          >
            <source src={VIDEO_URL} type="video/mp4" />
            Your browser does not support embedded video.
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center p-6 text-center text-muted">
            The promo video will appear here once <code className="mx-1">public/video/promo.mp4</code> is added.
          </div>
        )}
      </Tilt>
      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer">Text description of the video</summary>
        <p className="mt-2 max-w-2xl">
          A short animated introduction to Samrah Niazi: her name and role, followed by highlights of her game
          projects, skills, and achievements.
        </p>
      </details>
    </Section>
  );
}
