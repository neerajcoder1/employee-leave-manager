import React, { useState, useEffect } from "react";

const AnimatedNumber = ({ value }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setCurrent(0);
      return;
    }

    const duration = 800; // 800ms animation
    const stepTime = Math.abs(Math.floor(duration / end));

    const timer = setInterval(
      () => {
        start += 1;
        setCurrent(start);
        if (start >= end) {
          clearInterval(timer);
        }
      },
      Math.max(stepTime, 30),
    );

    return () => clearInterval(timer);
  }, [value]);

  return <span>{current}</span>;
};

export default AnimatedNumber;
