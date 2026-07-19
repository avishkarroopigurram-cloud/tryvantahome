import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
// DEV-ONLY: side-effect import — installs mock tokens + fetch interceptor when
// VITE_PREVIEW_MODE is set. Vite eliminates this entire module's active code in
// production builds (the env var is undefined → dead code elimination).
import "./lib/dev-preview/index";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
