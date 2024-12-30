import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function Main() {
  return (
    <div class="jumbotron-main centered">
      <div class="container-main">
        <DotLottieReact
          src="https://lottie.host/1219f273-7273-4aca-b4bb-f97260844fcf/4xfWSmoOco.lottie"
          autoplay
        />
        <h1 class="main-heading">Secrets</h1>
        <p class="subtext">Don't keep your secrets, share them anonymously!</p>
        <a class="btn-register" href="/register" role="button">
          Register
        </a>
        <a class="btn-login" href="/login" role="button">
          Login
        </a>
      </div>
    </div>
  );
}

export default Main;
