import React, { useEffect, useState } from "react";
import { Card, Typography, Box, styled, keyframes } from "@mui/material";
import { Mood, Favorite, Star, Cloud } from "@mui/icons-material";

// Keyframe Animations
const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.1); }
`;

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 5px rgba(62, 88, 121, 0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(62, 88, 121, 0.8)); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const FunkyCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    rgba(240, 244, 249, 0.9) 0%,
    rgba(229, 217, 242, 0.9) 50%,
    rgba(255, 182, 193, 0.9) 100%)`,
  padding: theme.spacing(8),
  textAlign: "center",
  position: "relative",
  overflow: "visible",
  marginTop: theme.spacing(6),
  borderRadius: 20,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(62, 88, 121, 0.1)",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
  },
}));

const FloatingEmoji = styled(Mood)({
  fontSize: 64,
  color: "#3E5879",
  animation: `${bounce} 3s ease-in-out infinite`,
  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
});

const DecorationIcon = styled(Box)(({ delay, top, left }) => ({
  position: "absolute",
  top,
  left,
  animation: `${float} 4s ease-in-out infinite`,
  animationDelay: delay,
  opacity: 0.6,
}));

const GlowingMessage = styled(Typography)(({ theme }) => ({
  fontSize: "2rem",
  fontWeight: 700,
  background: "linear-gradient(45deg, #3E5879, #ff0080)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: theme.spacing(3),
  animation: `${glow} 3s ease-in-out infinite`,
  "& span": {
    color: "#ff0080",
    fontStyle: "italic",
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: -5,
      left: 0,
      width: "100%",
      height: 2,
      background: "linear-gradient(90deg, transparent, #ff0080, transparent)",
      animation: `${rotate} 3s linear infinite`,
    },
  },
}));

const FunkySubMessage = styled(Typography)(({ theme }) => ({
  color: "#666",
  fontSize: "1.2rem",
  maxWidth: 500,
  margin: "0 auto",
  lineHeight: 1.6,
  position: "relative",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    width: 40,
    height: 40,
    background:
      "radial-gradient(circle, rgba(255,0,128,0.2) 0%, transparent 70%)",
    borderRadius: "50%",
    animation: `${float} 4s ease-in-out infinite`,
  },
  "&::before": { top: -20, left: "20%" },
  "&::after": { bottom: -20, right: "20%" },
}));

const EmptyState = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <FunkyCard
      elevation={3}
      style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.5s ease" }}
    >
      {/* Decorative Elements */}
      <DecorationIcon delay="0s" top="-30px" left="10%">
        <Star sx={{ fontSize: 30, color: "#ff0080" }} />
      </DecorationIcon>
      <DecorationIcon delay="1s" top="20%" left="85%">
        <Favorite sx={{ fontSize: 24, color: "#3E5879" }} />
      </DecorationIcon>
      <DecorationIcon delay="2s" top="70%" left="5%">
        <Cloud sx={{ fontSize: 28, color: "#9c27b0" }} />
      </DecorationIcon>

      <FloatingEmoji />
      <GlowingMessage>
        You haven't shared any secrets <span>yet</span>!
      </GlowingMessage>
      <FunkySubMessage>
        Share your first secret and unlock a world of mysterious possibilities.
        Don't worry, we're better at keeping secrets than your best friend! 🤫
      </FunkySubMessage>
      <Box
        sx={{
          mt: 4,
          opacity: 0.8,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(62, 88, 121, 0.3), transparent)",
          },
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            animation: `${glow} 4s ease-in-out infinite`,
          }}
        >
          <TypingAnimation />
        </Typography>
      </Box>
    </FunkyCard>
  );
};

export default EmptyState;
