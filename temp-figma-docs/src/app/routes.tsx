import { createBrowserRouter } from "react-router";
import Home from "./screens/Home";
import SessionWorkbench from "./screens/SessionWorkbench";
import RepetitionTool from "./screens/RepetitionTool";
import ReviewMode from "./screens/ReviewMode";
import FloorMarkEditor from "./screens/FloorMarkEditor";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/session/:id",
    Component: SessionWorkbench,
  },
  {
    path: "/session/:id/repetition/:regionId",
    Component: RepetitionTool,
  },
  {
    path: "/session/:id/review",
    Component: ReviewMode,
  },
  {
    path: "/session/:id/floor/:markId",
    Component: FloorMarkEditor,
  },
]);
