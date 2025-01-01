import React from "react";
import TypingAnimation from "./Typing Animation";
import axios from "axios";

function Nav(props) {
  function handleClick() {
    const receiverEmail = "patilswapnilsubhash@gmail.com";
    const subject = "Contacting from Secrets Website";
    const body = "Hello,";

    const mailtoUrl = `mailto:${receiverEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  }

  function logOut() {
    axios
      .get("/api/logout")
      .then((response) => {
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  }

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-logo">
          <a className="logo-text">Secrets</a>
          {props.onSecrets === false && (
            <div className="nav-tagline">
              <TypingAnimation />
            </div>
          )}
        </div>

        {props.onSecrets === false && (
          <div className="nav-main-tag">
            <TypingAnimation />
          </div>
        )}

        <div className="nav-buttons">
          <button className="nav-button" onClick={handleClick}>
            Developer
          </button>
          {props.onSecrets === true && (
            <button className="nav-button logout" onClick={logOut}>
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
