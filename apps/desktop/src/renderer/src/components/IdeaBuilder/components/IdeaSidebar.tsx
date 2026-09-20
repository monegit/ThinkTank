import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Folder, Lightbulb, Plus, Settings } from "lucide-react";

import { ideaBuilderStyles as styles } from "../styles";
import type { IdeaSidebarProps } from "../types";

/** Displays the workspace and prompt controls used to start a Codex generation. */
export function IdeaSidebar(props: IdeaSidebarProps) {
  const { folder, subfolders, selectedSubfolder, onSelectFolder, onCreateEmpty, onSelectSubfolder, onRenameSubfolder, onDeleteSubfolder, onOpenSettings } = props;
  const [contextMenu, setContextMenu] = useState<{ folder: string; x: number; y: number } | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [nextName, setNextName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const { sidebar } = props;

  useEffect(() => {
    if (!contextMenu) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setContextMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setContextMenu(null); };
    const closeOnBlur = () => setContextMenu(null);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("blur", closeOnBlur);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("blur", closeOnBlur);
    };
  }, [contextMenu]);

  const startRenaming = (subfolder: string) => {
    setRenamingFolder(subfolder);
    setNextName(subfolder.split("/").pop() ?? subfolder);
    setContextMenu(null);
  };

  return <>
    <aside aria-label="아이디어 사이드바" className={`${styles.sidebar} ${sidebar.dragging ? "" : styles.sidebarMotion}`} style={{ width: sidebar.collapsed ? 56 : sidebar.width, height: sidebar.collapsed ? 56 : "calc(100vh - 32px)" }}>
      <div className={styles.sidebarToolbar}>
        <button aria-label={sidebar.collapsed ? "사이드바 펼치기" : "사이드바 접기"} aria-expanded={!sidebar.collapsed} aria-controls="idea-sidebar-content" className={styles.sidebarToggle} onClick={() => { setContextMenu(null); sidebar.toggle(); }} title={sidebar.collapsed ? "사이드바 펼치기" : "사이드바 접기"} type="button">{sidebar.collapsed ? <ChevronRight aria-hidden="true" size={20} /> : <ChevronLeft aria-hidden="true" size={20} />}</button>
      </div>
      <div inert={sidebar.collapsed} aria-hidden={sidebar.collapsed} id="idea-sidebar-content" className={sidebar.collapsed ? styles.sidebarBodyCollapsed : styles.sidebarBodyExpanded} style={{ minWidth: sidebar.width }}>
      <div className={folder ? styles.sidebarContent : styles.folderEmpty}>
        {!folder ? <div className={styles.folderEmptyGroup}><Folder aria-hidden="true" className={styles.folderEmptyIcon} size={44} strokeWidth={1.5} /><p className={styles.folderEmptyMessage}>아이디어를 저장할 폴더를 선택해주세요</p><button className={styles.folderSelectButton} onClick={onSelectFolder} type="button">폴더 선택</button></div> : <><div className={styles.workspaceHeader}><span className={styles.workspaceName}>{folder.split("/").pop()}</span><button className={styles.changeFolderButton} onClick={onSelectFolder} type="button">변경</button></div><ul className={styles.folderList}>{subfolders.map((name) => <li className={styles.folderItemRoot} key={name}>{renamingFolder === name ? <input autoFocus className={styles.renameInput} onBlur={() => setRenamingFolder(null)} onChange={(event) => setNextName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && nextName.trim()) { onRenameSubfolder(name, nextName); setRenamingFolder(null); } if (event.key === "Escape") setRenamingFolder(null); }} value={nextName} /> : <button className={selectedSubfolder === name ? styles.folderItemSelected : styles.folderItem} onClick={() => onSelectSubfolder(name)} onContextMenu={(event) => { event.preventDefault(); setContextMenu({ folder: name, x: Math.min(event.clientX, window.innerWidth - 140), y: Math.min(event.clientY, window.innerHeight - 88) }); }} type="button"><Lightbulb aria-hidden="true" className={styles.folderIcon} size={16} />{name}</button>}</li>)}</ul></>}
      </div>
      <div className={styles.sidebarActions}>
        <button className={styles.sidebarGenerateButton} disabled={!folder} onClick={onCreateEmpty} type="button"><Plus aria-hidden="true" size={18} />생성</button>
        <button aria-label="설정" className={styles.settingsButton} onClick={onOpenSettings} title="설정" type="button"><Settings aria-hidden="true" size={20} /></button>
      </div>
      </div>
      {!sidebar.collapsed ? <div aria-label="사이드바 폭 조절" aria-controls="idea-sidebar-content" aria-orientation="vertical" aria-valuemin={sidebar.minWidth} aria-valuemax={sidebar.maxWidth} aria-valuenow={sidebar.width} aria-valuetext={`${sidebar.width}px`} className={styles.sidebarResize} role="separator" tabIndex={0} {...sidebar.resizeHandlers} /> : null}
    </aside>
    {sidebar.dragging ? createPortal(<div aria-hidden="true" className={styles.sidebarResizeOverlay} />, document.body) : null}
    {contextMenu ? createPortal(<div className={styles.contextMenu} ref={menuRef} role="menu" style={{ left: contextMenu.x, top: contextMenu.y }}><button className={styles.contextMenuItem} onClick={() => startRenaming(contextMenu.folder)} role="menuitem" type="button">이름 변경</button><button className={styles.contextMenuDelete} onClick={() => { const target = contextMenu.folder; setContextMenu(null); onDeleteSubfolder(target); }} role="menuitem" type="button">삭제</button></div>, document.body) : null}
  </>;
}
