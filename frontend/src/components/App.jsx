import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./Home";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import SecretPage from "./SecretPage";
import LoadingScreen from "./LoadingScreen";
import { authService } from "./apiService";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.checkAuth();
        setIsAuthenticated(response.status === 200);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
        <Route
          path="/secrets"
          element={isAuthenticated ? <SecretPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
