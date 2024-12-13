import React, { useState } from "react";
import { useSpring, animated } from "@react-spring/web";

const AnimatedButton = ({ children, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);

  const springStyles = useSpring({
    opacity: isHovering ? 0.6 : 1,
    transform: isHovering ? "scale(1.1)" : "scale(1)",
    config: { tension: 100, friction: 20 },
  });

  return (
    <animated.button
      style={springStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
    </animated.button>
  );
};

export default AnimatedButton;
