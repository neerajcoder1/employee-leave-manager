import React, { useState, useEffect, useRef } from "react";

const MorphingText = ({ texts, morphTime = 1.5, coolDownTime = 0.5 }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [time, setTime] = useState(Date.now());
  const [morph, setMorph] = useState(0);
  const [cooldown, setCooldown] = useState(coolDownTime);
  const elementRef = useRef(null);
  const queueRef = useRef([]);

  const set = (newText) => {
    const oldText = texts[textIndex];
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => queueRef.current.push(resolve));

    elementRef.current.innerHTML = generateSpans(oldText, newText, length);

    setTime(Date.now());
    setMorph(0);
    return promise;
  };

  const generateSpans = (oldText, newText, length) => {
    let html = "";
    for (let i = 0; i < length; i++) {
      const oldChar = oldText[i] || "";
      const newChar = newText[i] || "";
      const opacity = oldChar === newChar ? 1 : 0;
      const className = oldChar === newChar ? "static" : "disappear";
      html += `<span class="${className}" style="opacity:${opacity}">${oldChar}</span>`;
    }
    return html;
  };

  const animate = () => {
    const newTime = Date.now();
    const dt = (newTime - time) / 1000;
    setTime(newTime);

    let newMorph = morph + dt;
    let newCooldown = cooldown;

    if (newMorph >= morphTime) {
      newMorph = morphTime;
      if (queueRef.current.length > 0) {
        newCooldown -= dt;
        if (newCooldown <= 0) {
          const resolve = queueRef.current.shift();
          resolve();
          setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
          setCooldown(coolDownTime);
          return;
        }
      } else {
        // If no more texts in queue, just stay at the last text
        return;
      }
    }

    setMorph(newMorph);

    const fraction = newMorph / morphTime;
    const f = (v) => `max(0, min(1, ${v}))`;

    const spans = elementRef.current.children;
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const oldChar = texts[textIndex][i] || "";
      const newChar = texts[(textIndex + 1) % texts.length][i] || "";

      if (oldChar === newChar) {
        span.style.opacity = 1;
        span.className = "static";
      } else {
        const disappear = -(2 * fraction * (1 - fraction * 2));
        const appear = 1 - disappear;

        if (span.className === "static") {
          span.style.opacity = 1;
        } else if (span.className === "disappear") {
          span.style.opacity = disappear;
        } else if (span.className === "appear") {
          span.style.opacity = appear;
        }
      }
    }
  };

  useEffect(() => {
    let frameId;
    const startAnimation = async () => {
      while (true) {
        await set(texts[(textIndex + 1) % texts.length]);
        frameId = requestAnimationFrame(animate);
      }
    };

    startAnimation();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [textIndex, texts, morphTime, coolDownTime]);

  return (
    <div ref={elementRef} className="morphing-text">
      {texts[textIndex].split("").map((char, i) => (
        <span key={i} className="static">
          {char}
        </span>
      ))}
    </div>
  );
};

export default MorphingText;
