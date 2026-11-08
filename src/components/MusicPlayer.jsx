
import { useEffect, useRef, useState } from "react";
import festiveSitar from "../assets/festive-sitar.mp3";
import "./MusicPlayer.css";

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(festiveSitar);
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    const handleError = () => {
      setAudioError("Unable to load festive music.");
      setIsPlaying(false);
    };

    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setAudioError("");
      await audio.play();
      setIsPlaying(true);
    } catch {
      setAudioError("Click play to start the music.");
      setIsPlaying(false);
    }
  };

  if (isHidden) {
    return (
      <button
        type="button"
        className="music-player__show"
        onClick={() => setIsHidden(false)}
        aria-label="Show festive music player"
      >
        ♫ <span>Music</span>
      </button>
    );
  }

  return (
    <aside
      className={`music-player ${isPlaying ? "is-playing" : ""}`}
      aria-label="Diwali festive music player"
    >
      <div className="music-player__heading">
        <span className="music-player__icon" aria-hidden="true">
          🪔
        </span>

        <div className="music-player__track">
          <span className="music-player__eyebrow">
            FESTIVE MUSIC
          </span>
          <strong>Festive Sitar</strong>
        </div>

        <span className="music-player__equalizer" aria-hidden="true">
          <i /><i /><i />
        </span>
        <button
          type="button"
          className="music-player__hide"
          onClick={() => setIsHidden(true)}
          aria-label="Hide festive music player"
          title="Hide music player"
        >
          ×
        </button>
      </div>

      <div className="music-player__bottom">
        <span className="music-player__mood">
          Traditional festive melodies
        </span>

        <button
          type="button"
          className="music-player__toggle"
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pause music" : "Play music"}
          aria-pressed={isPlaying}
        >
          <span aria-hidden="true">
            {isPlaying ? "⏸" : "▶"}
          </span>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {audioError && (
        <p className="music-player__error" role="alert">
          {audioError}
        </p>
      )}
    </aside>
  );
}

export default MusicPlayer;
