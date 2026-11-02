import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../data/profile";

const MIN_MS = 1400; // always show the splash briefly so it never just flashes
const MAX_MS = 9000; // give up waiting for the avatar after this long

// Branded splash screen. It lifts once the avatar has loaded (it fires "avatar-ready") or after a time limit.
export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = performance.now();
    let hide = 0;
    const finish = () => {
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setVisible(false), Math.max(0, MIN_MS - (performance.now() - start)));
    };
    window.addEventListener("avatar-ready", finish);
    const giveUp = window.setTimeout(finish, MAX_MS);
    return () => {
      window.removeEventListener("avatar-ready", finish);
      window.clearTimeout(giveUp);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const initials = profile.name.split(" ").map((w) => w[0]).join("");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="status"
          aria-label="Loading portfolio"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-bg"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="relative flex items-center justify-center">
            <div className="splash-ring" />
            <span className="font-display title-3d absolute text-3xl font-bold">{initials}</span>
          </div>
          <p className="gradient-text font-display text-xl font-bold tracking-wide">{profile.name}</p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent via-accent2 to-accent3"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
