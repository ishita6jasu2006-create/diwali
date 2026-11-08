
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import DiyaSection from "./components/DiyaSection";
import GreetingGenerator from "./components/GreetingGenerator";
import RangoliCreator from "./components/RangoliCreator";
import Fireworks from "./components/Fireworks";
import EcoSafety from "./components/EcoSafety";
import SkyLantern from "./components/SkyLantern";
import MusicPlayer from "./components/MusicPlayer";

import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <MusicPlayer />

      <main>
        <Routes>
          <Route path="/"           element={<Hero />} />
          <Route path="/diya"       element={<DiyaSection />} />
          <Route path="/rangoli"    element={<RangoliCreator />} />
          <Route path="/greetings"  element={<GreetingGenerator />} />
          <Route path="/celebration" element={<Fireworks />} />
          <Route path="/eco"        element={<EcoSafety />} />
          <Route path="/lantern"    element={<SkyLantern />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
