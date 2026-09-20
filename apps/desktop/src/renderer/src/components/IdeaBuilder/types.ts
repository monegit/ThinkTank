/** A generated file ready to be written into the selected project folder. */
export interface GeneratedFile {
  /** Stores the path relative to the selected folder. */
  path: string;
  /** Stores the complete UTF-8 file contents. */
  content: string;
}

/** The generated project derived from a product idea. */
export interface GeneratedProject {
  /** Lists all files that make up the generated project. */
  files: GeneratedFile[];
  /** Provides a self-contained document for the in-app preview. */
  preview: string;
}

/** A visible message exchanged with the Codex CLI agent. */
export interface ChatMessage {
  /** Records the preview element attached to this message. */
  selectedElement?: import("./elementPicker").SelectedElement;
  /** Identifies who sent the message. */
  role: "user" | "agent";
  /** Contains the message shown in the conversation. */
  content: string;
}

/** Displays the workspace and prompt controls used to start a Codex generation. */
export interface IdeaSidebarProps {
  /** Controls the panel width and collapsed state. */
  sidebar: ReturnType<typeof import("./hooks/useSidebarResize").useSidebarResize>;
  /** Opens the application settings page. */
  onOpenSettings: () => void;
  /** Shows the currently selected workspace folder. */
  folder: string | null;
  /** Lists the selected workspace's immediate child folders. */
  subfolders: string[];
  /** Identifies the child folder currently shown in the preview. */
  selectedSubfolder: string | null;
  /** Opens the native workspace folder picker. */
  onSelectFolder: () => void;
  /** Creates and selects a new empty idea folder. */
  onCreateEmpty: () => void;
  /** Loads a child folder's HTML into the preview. */
  onSelectSubfolder: (subfolder: string) => void;
  /** Renames a child folder within the selected workspace. */
  onRenameSubfolder: (subfolder: string, nextName: string) => void;
  /** Deletes a child folder after user confirmation. */
  onDeleteSubfolder: (subfolder: string) => void;
}

/** Displays the idea chat sidebar and document editor. */
export interface PromptComposerProps {
  /** Identifies the currently selected CLI model, or its default. */
  model: string | null;
  /** Lists models available for the selected CLI. */
  models: import("../../../../cli-models").CliModel[];
  /** Indicates that the model list is loading. */
  modelsLoading: boolean;
  /** Prevents model changes while settings are saving. */
  modelPending: boolean;
  /** Explains model loading or saving failures. */
  modelError: string | null;
  /** Identifies the selected reasoning level, or the CLI default. */
  reasoning: import("../../../../settings").ReasoningEffort | null;
  /** Saves a reasoning level for the selected CLI. */
  onSelectReasoning: (effort: import("../../../../settings").ReasoningEffort | null) => void;
  /** Saves the selected CLI model. */
  onSelectModel: (model: string | null) => void;
  /** Controls the chat panel width and collapsed state. */
  sidebar: ReturnType<typeof import("./hooks/useSidebarResize").useSidebarResize>;
  /** Describes the currently selected preview element. */
  selectedElement: import("./elementPicker").SelectedElement | null;
  /** Indicates that preview element selection is active. */
  isPickingElement: boolean;
  /** Indicates that a preview is available for selection. */
  canPickElement: boolean;
  /** Starts or cancels preview element selection. */
  onToggleElementPicker: () => void;
  /** Clears the selected element from the next request. */
  onClearElement: () => void;
  /** Indicates that the current response is stopping. */
  isStopping: boolean;
  /** Stops the active idea's current response. */
  onStopChat: () => Promise<void>;
  /** Lists the active idea's temporary conversation. */
  chatMessages: ChatMessage[];
  /** Observable CLI actions for the current request. */
  progress: import("../../../../cli-progress").CliProgress[];
  /** Contains the active idea's unsent message. */
  chatInput: string;
  /** Indicates that the active idea is awaiting a reply. */
  isReplying: boolean;
  /** Updates the active idea's unsent message. */
  onChatInputChange: (input: string) => void;
  /** Provides the folder name for the generated component. */
  title: string;
  /** Provides the current component idea prompt. */
  idea: string;
  /** Indicates whether a workspace folder is available. */
  hasFolder: boolean;
  /** Indicates whether Codex is currently generating files. */
  isGenerating: boolean;
  /** Shows a successful generation message when available. */
  message: string | null;
  /** Shows a folder-selection or generation error when available. */
  error: string | null;
  /** Controls whether the composer panel is visible. */
  isOpen: boolean;
  /** Updates the idea prompt as the user types. */
  onIdeaChange: (idea: string) => void;
  /** Updates the generated component's folder name. */
  onTitleChange: (title: string) => void;
  /** Starts component generation in the selected workspace. */
  onGenerate: () => void;
  /** Toggles the composer panel visibility. */
  onToggle: () => void;
  /** Sends a conversational message to the Codex CLI agent. */
  onChat: () => Promise<void>;
}

/** Displays the floating document editor for the active idea. */
export interface DocumentComposerProps extends Pick<PromptComposerProps, "title" | "idea" | "hasFolder" | "isGenerating" | "message" | "error" | "isOpen" | "onTitleChange" | "onIdeaChange" | "onGenerate" | "onToggle" | "isPickingElement" | "canPickElement" | "onToggleElementPicker"> {
  /** Positions the editor beside the chat sidebar. */
  rightOffset: number;
}
