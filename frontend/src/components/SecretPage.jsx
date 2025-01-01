import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  styled,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete, Save, Close, Add } from "@mui/icons-material";
import Nav from "./Nav";
import EmptyState from "./EmptyState";
import { secretService } from "./apiService";
import LoadingScreen from "./LoadingScreen";
import LoadingSecrets from "./LoadingSecrets";

const ClippedCard = styled(Card)(({ theme }) => ({
  position: "relative",
  background: "#3E5879",
  clipPath:
    "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
  border: "1px hidden",
  marginBottom: theme.spacing(3),
  "&::before": {
    content: '""',
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    background: "#F0F4F9",
    clipPath:
      "polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)",
    zIndex: 0,
  },
  "&:hover": {
    transform: "translateX(5px)",
    "&::after": {
      transform: "translateX(-10px)",
      opacity: 1,
    },
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: -5,
    right: 5,
    bottom: 0,
    background: "linear-gradient(to right, #4B83EF, #ff0080)",
    clipPath:
      "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
    zIndex: -1,
    opacity: 0,
    transition: "all 0.3s ease",
  },
}));

const ModernInput = styled("input")({
  background: "#F5EFFF",
  border: "none",
  color: "#213555",
  padding: "8px 12px",
  borderRadius: "4px",
  width: "100%",
  "&:focus": {
    outline: "1px solid #685752",
    background: "#F5EFFF",
  },
});

const AddCard = styled(Card)(({ theme }) => ({
  background: "#F0F4F9",
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  border: "2px dashed #3E5879",
}));

const LoadingContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "200px",
});

const SecretPage = () => {
  const [error, setError] = useState("");
  const [secrets, setSecrets] = useState([]);
  const [newSecret, setNewSecret] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      setIsLoading(true);
      const response = await secretService.fetchSecrets();
      if (response.data.success) {
        setSecrets(response.data.secrets);
        setError("");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load secrets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSecret = async () => {
    if (!newSecret.trim()) return;
    setActionLoading("add");

    try {
      const response = await secretService.addSecret(newSecret);
      if (response.data.success) {
        setSecrets((prev) => [...prev, response.data.secret]);
        setNewSecret("");
        setError("");
      }
    } catch (err) {
      console.error("Add error:", err);
      setError("Failed to add secret. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async (id, newTitle) => {
    if (!newTitle.trim()) return;
    setActionLoading(id);

    try {
      const response = await secretService.updateSecret(id, newTitle);
      if (response.data.success) {
        setSecrets((prev) =>
          prev.map((secret) =>
            secret.secret_id === id ? response.data.secret : secret
          )
        );
        setEditingId(null);
        setError("");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update secret. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      const response = await secretService.deleteSecret(id);
      if (response.data.success) {
        setSecrets((prev) => prev.filter((secret) => secret.secret_id !== id));
        setError("");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete secret. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Nav onSecrets={true} />
        <LoadingSecrets message="Unveiling your secrets... Patience!" />
      </div>
    );
  }

  return (
    <div>
      <Nav onSecrets={true} />
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <AddCard className="AddCard">
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter a new secret..."
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddSecret();
              }}
              disabled={actionLoading === "add"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={
                actionLoading === "add" ? (
                  <CircularProgress size={20} />
                ) : (
                  <Add />
                )
              }
              onClick={handleAddSecret}
              disabled={actionLoading === "add"}
              sx={{
                backgroundColor: "#3E5879",
                "&:hover": {
                  backgroundColor: "#4B83EF",
                },
              }}
            >
              Add
            </Button>
          </Box>
        </AddCard>

        {secrets.length === 0 ? (
          <EmptyState />
        ) : (
          secrets.map((secret) => (
            <ClippedCard key={secret.secret_id}>
              <CardContent
                sx={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
                }}
              >
                {editingId === secret.secret_id ? (
                  <ModernInput
                    defaultValue={secret.secret}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave(secret.secret_id, e.target.value);
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    disabled={actionLoading === secret.secret_id}
                    autoFocus
                  />
                ) : (
                  <Typography sx={{ color: "#1A1A1A", fontWeight: 600 }}>
                    {secret.secret}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  {actionLoading === secret.secret_id ? (
                    <CircularProgress size={24} />
                  ) : editingId === secret.secret_id ? (
                    <>
                      <IconButton
                        onClick={(e) => {
                          const input = e.target
                            .closest(".MuiCardContent-root")
                            .querySelector("input");
                          handleSave(secret.secret_id, input.value);
                        }}
                      >
                        <Save />
                      </IconButton>
                      <IconButton onClick={() => setEditingId(null)}>
                        <Close />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        onClick={() => setEditingId(secret.secret_id)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(secret.secret_id)}
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardContent>
            </ClippedCard>
          ))
        )}
      </Box>
    </div>
  );
};

export default SecretPage;
