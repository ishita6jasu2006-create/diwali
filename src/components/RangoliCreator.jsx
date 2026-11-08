
import RangoliBackground from "./RangoliBackground";
import { useState, useRef } from "react";

const palette = [
  "#FFD700", "#FF8C42", "#E63946", "#E91E8C",
  "#8E44AD", "#168AAD", "#20BFC1", "#16803C",
  "#83B918", "#FFFFFF", "#F4A6C1", "#A66A35"
];

const templates = [
  { id: "flower", name: "Floral Bloom", icon: "🌺" },
  { id: "lotus", name: "Lotus Design", icon: "🪷" },
 
];

export default function RangoliCreator() {
  const [template, setTemplate] = useState("flower");
  const [selectedColor, setSelectedColor] = useState("#FFD700");
  const [fills, setFills] = useState({});
  const [tool, setTool] = useState("fill");
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const svgRef = useRef(null);

  const paint = (id) => {
    const next = {
      ...fills,
      [id]: tool === "eraser" ? "#FFFFFF" : selectedColor
    };

    setFills(next);
    const updated = [...history.slice(0, historyIndex + 1), next];
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const color = (id) => fills[id] || "#FFFFFF";

  const changeTemplate = (id) => {
    setTemplate(id);
    setFills({});
    setHistory([{}]);
    setHistoryIndex(0);
  };

  const reset = () => {
    setFills({});
    setHistory([{}]);
    setHistoryIndex(0);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setFills(history[i]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) return; {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setFills(history[i]);
    }
  };

  const Region = ({ id, children }) => (
    <g
      onClick={() => paint(id)}
      style={{ cursor: "pointer" }}
    >
      {children}
    </g>
  );

  const Circle = ({ id, cx, cy, r, stroke = "#d4af6a", sw = 3 }) => (
    <Region id={id}>
      <circle
        cx={cx} cy={cy} r={r}
        fill={color(id)}
        stroke={stroke}
        strokeWidth={sw}
      />
    </Region>
  );

  const Path = ({ id, d, stroke = "#d4af6a", sw = 3 }) => (
    <Region id={id}>
      <path
        d={d}
        fill={color(id)}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </Region>
  );

  const Flower = () => (
    <>
      {/* Outer pointed petals */}
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 36} 200 200)`}>
          <Path
            id={`flower-outer-${i}`}
            d="M200 195 C157 158 157 105 200 42 C243 105 243 158 200 195Z"
          />
          <Path
            id={`flower-detail-${i}`}
            d="M200 180 Q185 125 200 75 Q215 125 200 180Z"
            stroke="#b99a65"
            sw={1.5}
          />
        </g>
      ))}

      {/* Middle petals */}
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 36 + 18} 200 200)`}>
          <Path
            id={`flower-middle-${i}`}
            d="M200 195 C165 170 165 132 200 91 C235 132 235 170 200 195Z"
          />
        </g>
      ))}

      {/* Inner flower */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45} 200 200)`}>
          <Path
            id={`flower-inner-${i}`}
            d="M200 195 C177 177 178 149 200 123 C222 149 223 177 200 195Z"
          />
        </g>
      ))}

      {/* Leaves */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45 + 22.5} 200 200)`}>
          <Path
            id={`flower-leaf-${i}`}
            d="M200 235 Q145 245 135 205 Q170 195 200 235Z"
          />
        </g>
      ))}

      <Circle id="flower-center-outer" cx="200" cy="200" r="43" />
      <Circle id="flower-center-inner" cx="200" cy="200" r="27" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        return (
          <Circle
            key={i}
            id={`flower-seed-${i}`}
            cx={200 + 34 * Math.cos(a)}
            cy={200 + 34 * Math.sin(a)}
            r="4"
            sw={1}
          />
        );
      })}
    </>
  );


const Lotus = () => (
  <>
    {/* BACK LAYER: FIVE LOTUS SEPALS */}
    <Path
      id="lotus-leaf-left-outer"
      d="M190 245
         C145 225 100 230 65 270
         C105 285 155 278 195 260
         Q198 252 190 245Z"
    />

    <Path
      id="lotus-leaf-left-inner"
      d="M195 250
         C155 250 135 275 125 325
         C165 310 185 290 200 265Z"
    />

    <Path
      id="lotus-leaf-center"
      d="M200 250
         C168 280 175 335 200 380
         C225 335 232 280 200 250Z"
    />

    <Path
      id="lotus-leaf-right-inner"
      d="M205 250
         C245 250 265 275 275 325
         C235 310 215 290 200 265Z"
    />

    <Path
      id="lotus-leaf-right-outer"
      d="M210 245
         C255 225 300 230 335 270
         C295 285 245 278 205 260
         Q202 252 210 245Z"
    />

    {/* OUTER LEFT AND RIGHT PETALS */}
    <Path
      id="lotus-petal-outer-left"
      d="M195 245
         C140 235 75 205 35 165
         C100 155 155 185 195 245Z"
    />

    <Path
      id="lotus-petal-outer-right"
      d="M205 245
         C260 235 325 205 365 165
         C300 155 245 185 205 245Z"
    />

    {/* SECOND LAYER PETALS */}
    <Path
      id="lotus-petal-side-left"
      d="M195 240
         C135 215 100 145 105 75
         C165 95 190 155 200 238Z"
    />

    <Path
      id="lotus-petal-side-right"
      d="M205 240
         C265 215 300 145 295 75
         C235 95 210 155 200 238Z"
    />

    {/* INNER SIDE PETALS */}
    <Path
      id="lotus-petal-inner-left"
      d="M197 238
         C155 205 145 125 165 55
         C210 105 215 175 200 238Z"
    />

    <Path
      id="lotus-petal-inner-right"
      d="M203 238
         C245 205 255 125 235 55
         C190 105 185 175 200 238Z"
    />

    {/* MAIN CENTRAL LOTUS PETAL */}
    <Path
      id="lotus-petal-main"
      d="M200 240
         C135 195 145 85 200 20
         C255 85 265 195 200 240Z"
    />

    {/* CENTRE: COVERS ALL PETAL JOINING EDGES */}
    <Circle
      id="lotus-center"
      cx="200"
      cy="240"
      r="14"
      stroke="#d4af6a"
      sw={2.5}
    />
  </>
);




  

  const download = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current.cloneNode(true);
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#21152f";
      ctx.fillRect(0, 0, 1200, 1200);
      ctx.drawImage(image, 0, 0, 1200, 1200);

      const link = document.createElement("a");
      link.download = `aurora-${template}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  return (
    <section className="rangoli-section" id="rangoli">
          <RangoliBackground />
      <div className="section-heading">
        <span className="section-tag">YOUR CREATIVE CORNER</span>
        <h2>Create Your Own Rangoli</h2>
        <p>Choose a traditional design and colour every detail.</p>
      </div>

      <div className="rangoli-template-list">
        {templates.map((item) => (
          <button
            key={item.id}
            className={`rangoli-template ${template === item.id ? "selected" : ""}`}
            onClick={() => changeTemplate(item.id)}
          >
            <span className="template-icon">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </div>

      <div className="rangoli-studio">
        <div className="rangoli-art">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="rangoli-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="400" height="400" fill="#21152f" />
            <circle cx="200" cy="200" r="188" fill="none" stroke="#d4af6a" strokeWidth="2" />
            <circle cx="200" cy="200" r="180" fill="none" stroke="#d4af6a" strokeWidth="1" strokeDasharray="3 6" />

            {template === "flower" && <Flower />}
            {template === "lotus" && <Lotus />}
            {template === "peacock" && <Peacock />}
            {template === "diya" && <Diya />}
          </svg>
        </div>

        <div className="rangoli-controls">
          <h3>Choose a Colour</h3>

          <div className="rangoli-palette">
            {palette.map((c) => (
              <button
                key={c}
                className={`color-swatch ${selectedColor === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setSelectedColor(c);
                  setTool("fill");
                }}
                aria-label={`Select ${c}`}
              />
            ))}
            <input
              className="custom-rangoli-color"
              type="color"
              value={selectedColor}
              onChange={(e) => {
                setSelectedColor(e.target.value);
                setTool("fill");
              }}
              title="Choose custom colour"
            />
          </div>

          <h3 className="rangoli-tools-heading">Tools</h3>

          <div className="rangoli-tool-buttons">
            <button
              className={tool === "fill" ? "active" : ""}
              onClick={() => setTool("fill")}
            >
              Fill Colour
            </button>
            <button
              className={tool === "eraser" ? "active" : ""}
              onClick={() => setTool("eraser")}
            >
              Eraser
            </button>
          </div>

          <div className="rangoli-action-buttons">
            <button onClick={reset}>↻<span>Reset</span></button>
            <button onClick={undo} disabled={historyIndex === 0}>↶<span>Undo</span></button>
            <button onClick={redo} disabled={historyIndex === history.length - 1}>↷<span>Redo</span></button>
            <button className="rangoli-download" onClick={download}>↓<span>Download</span></button>
          </div>

          <p className="rangoli-tip">
            All designs start in white. Choose a colour and click each section.
          </p>
        </div>
      </div>
    </section>
  );
}
