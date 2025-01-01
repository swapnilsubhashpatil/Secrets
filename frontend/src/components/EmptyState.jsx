import React from "react";
import { Card, Typography, Box, styled } from "@mui/material";
import { Mood } from "@mui/icons-material";
import TypingAnimation from "./Typing Animation";

const EmptyStateCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(135deg, #F0F4F9 0%, #E5D9F2 100%)",
  padding: theme.spacing(6),
  textAlign: "center",
  position: "relative",
  overflow: "visible",
  marginTop: theme.spacing(4),
  "&::before": {
    content: '""',
    position: "absolute",
    top: -20,
    left: "50%",
    transform: "translateX(-50%)",
    width: 40,
    height: 40,
    background: "#3E5879",
    borderRadius: "50%",
    animation: "float 3s ease-in-out infinite",
  },
  "@keyframes float": {
    "0%, 100%": {
      transform: "translateX(-50%) translateY(0)",
    },
    "50%": {
      transform: "translateX(-50%) translateY(-10px)",
    },
  },
  "@keyframes wave": {
    "0%, 100%": {
      transform: "rotate(0deg)",
    },
    "50%": {
      transform: "rotate(15deg)",
    },
  },
}));

const WavingEmoji = styled(Mood)({
  fontSize: 48,
  color: "#3E5879",
  marginBottom: 16,
  animation: "wave 2s ease-in-out infinite",
});

const EmptyStateMessage = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 600,
  color: "#3E5879",
  marginBottom: theme.spacing(2),
  "& span": {
    color: "#ff0080",
    fontStyle: "italic",
  },
}));

const SubMessage = styled(Typography)(({ theme }) => ({
  color: "#666",
  fontSize: "1rem",
  maxWidth: 400,
  margin: "0 auto",
}));

const EmptyState = () => {
  return (
    <EmptyStateCard elevation={0}>
      <WavingEmoji />
      <EmptyStateMessage>
        You haven't shared any secrets <span>yet</span> !
      </EmptyStateMessage>
      <SubMessage>
        Share your first secret and unlock a world of mysterious possibilities.
        Don't worry, we're better at keeping secrets than your best friend! 🤫
      </SubMessage>
      <Box sx={{ mt: 3, opacity: 0.7 }}>
        <Typography variant="body2" color="textSecondary">
          <TypingAnimation />
        </Typography>
      </Box>
    </EmptyStateCard>
  );
};

export default EmptyState;
