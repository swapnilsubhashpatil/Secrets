import React from "react";
import Nav from "./Nav";
import Main from "./Main";

function Home() {
  return (
    <div>
      <Nav onSecrets={false} />
      <Main />
    </div>
  );
}

export default Home;
