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

// Keep existing styled components...

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
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
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
