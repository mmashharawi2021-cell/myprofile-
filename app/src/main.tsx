import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./content/SiteContent";
import "./styles.css";
import "./studio.css";
import "./projects.css";
import "./content/content.css";
import "./brand-intro.css";
import "./reference-intro.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </React.StrictMode>,
);
