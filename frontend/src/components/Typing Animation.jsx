import { TypeAnimation } from "react-type-animation";
import React from "react";

function TypingAnimation() {
  return (
    <TypeAnimation
      sequence={[
        "Your secrets are safe here.",
        2000,
        "Your secrets are locked here.",
        2000,
        "Your secrets are secured here.",
        2000,
        "Your secrets are hidden here.",
        2000,
      ]}
      wrapper="span"
      speed={40}
      repeat={Infinity}
    />
  );
}

export default TypingAnimation;
