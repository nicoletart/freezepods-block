import React, { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import Link from "next/link";

const AnimatedButton = ({ children, onClick, href, className }) => {
  const [isHovering, setIsHovering] = useState(false);

  const springStyles = useSpring({
    opacity: isHovering ? 0.6 : 1,
    transform: isHovering ? "scale(1.1)" : "scale(1)",
    config: { tension: 100, friction: 20 },
    marginTop: "20px",
  });

  if (href) {
    return (
      <Link href={href} passHref>
        <animated.div
          style={springStyles}
          className={`animated-button ${className}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {children}
        </animated.div>
      </Link>
    );
  }

  return (
    <animated.button
      style={springStyles}
      className={`animated-button ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
    </animated.button>
  );
};

export default AnimatedButton;
