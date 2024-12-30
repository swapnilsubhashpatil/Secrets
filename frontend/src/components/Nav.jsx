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
        // Handle successful logout (e.g., redirect to login page)
        window.location.href = "/"; // Redirect to login page
      })
      .catch((error) => {
        // Handle errors (e.g., display an error message to the user)
        console.error("Logout failed:", error);
        // Optionally, display an error message to the user
      });
  }

  return (
    <nav className="img">
      <div className="container">
        <div className="logo">
          <a>Secrets</a>
          {props.onSecrets === false && (
            <div className="tagline">
              <TypingAnimation />
            </div>
          )}
        </div>
        {props.onSecrets === false && (
          <div className="main-tag">
            <TypingAnimation />
          </div>
        )}

        <div className="button">
          <button class="contact-btn" onClick={handleClick}>
            Developer
          </button>
          {props.onSecrets === true && (
            <button className="contact-btn" onClick={logOut}>
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
