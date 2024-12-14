"use client";

import { useRouter } from "next/navigation"; // For dynamic back functionality
import { useSpring, animated } from "@react-spring/web";
import AnimatedButton from "./AnimatedButton";

const BackButton = ({ label = "Back" }) => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <AnimatedButton onClick={goBack} className="back-button">
      {label}
    </AnimatedButton>
  );
};

export default BackButton;
