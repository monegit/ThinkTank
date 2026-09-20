import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";
import "@think-tank/styles";
import { IdeaBuilder } from "./components/IdeaBuilder";

function DesktopApp() {
  return (
    <>
      <IdeaBuilder />
      {import.meta.env.DEV ? <Agentation /> : null}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<DesktopApp />);
