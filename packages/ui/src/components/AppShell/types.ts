import type { ReactNode } from "react";

/** The supported visual emphasis for AppShell's primary action. */
export type AppShellActionTone = "primary" | "neutral";

/** A centered, platform-neutral application screen with an optional primary action. */
export interface AppShellProps {
  /** Displays the screen's primary heading. */
  title: string;
  /** Renders content inside the screen card below the introductory text. */
  children?: ReactNode;
  /** Sets the visual emphasis of the optional primary action. */
  actionTone?: AppShellActionTone;
  /** Runs when the optional primary action is pressed. */
  onAction?: () => void;
}
