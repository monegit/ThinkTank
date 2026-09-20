import type { CliProvider } from "../../../../settings";
import type { CliModel } from "../../../../cli-models";

/** Displays the coding CLI preference. */
export interface SettingsPageProps {
  /** Identifies the selected model, or the CLI default. */
  model: string | null;
  /** Lists models reported by the selected CLI. */
  models: CliModel[];
  /** Indicates that the model catalog is loading. */
  modelsLoading: boolean;
  /** Explains a model catalog error. */
  modelsError: string | null;
  /** Saves the selected model. */
  onSelectModel: (model: string | null) => void;
  /** Reloads the available models. */
  onRefreshModels: () => void;
  /** Identifies the saved CLI choice. */
  provider: CliProvider;
  /** Disables changes while preferences are loading or saving. */
  pending: boolean;
  /** Displays a preference error. */
  error: string | null;
  /** Displays save confirmation. */
  saved: boolean;
  /** Saves the selected CLI. */
  onSelect: (provider: CliProvider) => void;
  /** Returns to the project preview. */
  onBack: () => void;
}
