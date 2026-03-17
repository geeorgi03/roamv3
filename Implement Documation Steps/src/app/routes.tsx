import { createBrowserRouter } from "react-router";
import Home from "./screens/Home";
import CaptureCamera from "./screens/CaptureCamera";
import InboxScreen from "./screens/InboxScreen";
import SessionWorkbench from "./screens/SessionWorkbench";
import RepetitionTool from "./screens/RepetitionTool";
import ReviewMode from "./screens/ReviewMode";
import FloorMarkEditor from "./screens/FloorMarkEditor";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import ClipShareView from "./screens/ClipShareView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/capture",
    Component: CaptureCamera,
  },
  {
    path: "/inbox",
    Component: InboxScreen,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordScreen,
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
  {
    path: "/share/:token",
    Component: ClipShareView,
  },
]);
