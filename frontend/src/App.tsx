import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero, { MoveChips } from "./components/Hero";
import Marquee from "./components/Marquee";
import VideoSection from "./components/VideoSection";
import ChatWidget from "./components/ChatWidget";
import Backdrop from "./components/Backdrop";
import CursorGlow from "./components/CursorGlow";
import ScrollProgress from "./components/ScrollProgress";
import Preloader from "./components/Preloader";
import Footer from "./components/Footer";
import Gallery from "./components/Gallery";
import { About, Skills, Projects, Experience, Contact } from "./components/Sections";
import { initAnalytics } from "./lib/analytics";

export default function App() {
  useEffect(initAnalytics, []);

  return (
    <>
      <a
        href="#main"
        className="absolute left-2 top-2 z-[80] -translate-y-20 rounded bg-accent px-4 py-2 font-bold text-on-accent focus:translate-y-0"
      >
        Skip to content
      </a>
      <Preloader />
      <ScrollProgress />
      <Backdrop />
      <CursorGlow />
      <Navbar />
      <main id="main">
        <Hero />
        {/* Phones: the move chips sit right under the avatar, and the technologies strip lives in the hero text instead. */}
        <div className="relative z-10 px-4 pb-8 pt-3 md:hidden">
          <MoveChips className="justify-center" />
        </div>
        <div className="hidden md:block">
          <Marquee />
        </div>
        <About />
        <VideoSection />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
        <Gallery />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
