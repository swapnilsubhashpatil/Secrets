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
} from "@mui/material";
import { Edit, Delete, Save, Close, Add } from "@mui/icons-material";
import Nav from "./Nav";
import EmptyState from "./EmptyState";
import { secretService } from "./apiService";

// Styled Components
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

const SecretPage = () => {
  // State Management
  const [error, setError] = useState("");
  const [secrets, setSecrets] = useState([]);
  const [newSecret, setNewSecret] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Fetch secrets on component mount
  useEffect(() => {
    fetchSecrets();
  }, []);

  // Fetch all secrets
  const fetchSecrets = async () => {
    try {
      const response = await secretService.fetchSecrets();
      if (response.data.success) {
        setSecrets(response.data.secrets);
        setError("");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load secrets. Please try again.");
    }
  };

  // Add new secret
  const handleAddSecret = async () => {
    if (!newSecret.trim()) return;

    try {
      const response = await secretService.addSecret(newSecret);
      if (response.data.success) {
        await fetchSecrets(); // Refresh the list
        setNewSecret("");
        setError("");
      }
    } catch (err) {
      console.error("Add error:", err);
      setError("Failed to add secret. Please try again.");
    }
  };

  // Enable edit mode
  const handleEdit = (id) => {
    setEditingId(id);
  };

  // Cancel edit mode
  const handleCancel = () => {
    setEditingId(null);
  };

  // Save edited secret
  const handleSave = async (id, newTitle) => {
    if (!newTitle.trim()) return;

    try {
      const response = await secretService.updateSecret(id, newTitle);
      if (response.data.success) {
        await fetchSecrets(); // Refresh the list
        setEditingId(null);
        setError("");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update secret. Please try again.");
    }
  };

  // Delete secret
  const handleDelete = async (id) => {
    try {
      const response = await secretService.deleteSecret(id);
      if (response.data.success) {
        await fetchSecrets(); // Refresh the list
        setError("");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete secret. Please try again.");
    }
  };

  return (
    <div>
      <Nav onSecrets={true} />
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        {/* Error Display */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Add New Secret Section */}
        <AddCard>
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSecret}
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

        {/* Secrets List */}
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
                  // Edit Mode
                  <ModernInput
                    defaultValue={secret.secret}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave(secret.secret_id, e.target.value);
                      }
                      if (e.key === "Escape") {
                        handleCancel();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  // Display Mode
                  <Typography sx={{ color: "#1A1A1A", fontWeight: 600 }}>
                    {secret.secret}
                  </Typography>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  {editingId === secret.secret_id ? (
                    <>
                      <IconButton
                        onClick={(e) => {
                          const input = e.target
                            .closest(".MuiCardContent-root")
                            .querySelector("input");
                          handleSave(secret.secret_id, input.value);
                        }}
                        sx={{
                          color: "#90caf9",
                          "&:hover": { bgcolor: "rgba(144, 202, 249, 0.08)" },
                        }}
                      >
                        <Save />
                      </IconButton>
                      <IconButton
                        onClick={handleCancel}
                        sx={{
                          color: "#f48fb1",
                          "&:hover": { bgcolor: "rgba(244, 143, 177, 0.08)" },
                        }}
                      >
                        <Close />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        onClick={() => handleEdit(secret.secret_id)}
                        sx={{
                          color: "#A7D477",
                          "&:hover": { bgcolor: "#E5D9F2" },
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(secret.secret_id)}
                        sx={{
                          color: "#F72C5B",
                          "&:hover": { bgcolor: "#E5D9F2" },
                        }}
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
