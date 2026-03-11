import React from "react";
import ReactDOM from "react-dom/client";
import { Refine } from "@refinedev/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { authProvider, dataProvider } from "@/admin/core";
import { ToastProvider } from "@/components/ToastProvider";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            resources={[
              { name: "pets" },
              { name: "users" },
            ]}
          >
            <App />
          </Refine>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
