import { useEffect, useRef } from "react";
import { FileText, MousePointer2 } from "lucide-react";
import { ideaBuilderStyles as styles } from "../styles";
import type { DocumentComposerProps } from "../types";

export function DocumentComposer(props: DocumentComposerProps) {
  const { title, idea, hasFolder, isGenerating, message, error, isOpen, onTitleChange, onIdeaChange, onGenerate, onToggle, rightOffset, isPickingElement, canPickElement, onToggleElementPicker } = props;
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const outside = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) onToggle();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { onToggle(); buttonRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [isOpen, onToggle]);
  return <div className={styles.composerRoot} style={{ right: rightOffset }}>
    {isOpen ? <section aria-label="문서 편집" className={styles.composerPanel} ref={panelRef} style={{ maxWidth: `calc(100vw - ${rightOffset + 24}px)`, maxHeight: "calc(100vh - 112px)" }}>
      <div className={styles.documentHeader}><span>문서</span><button aria-label="문서 닫기" className={styles.sidebarToggle} onClick={onToggle} type="button">×</button></div>
      <input aria-label="제목" autoFocus className={styles.titleInput} onChange={(event) => onTitleChange(event.target.value)} placeholder="제목" value={title} />
      <textarea aria-label="내용" className={styles.composerTextarea} onChange={(event) => onIdeaChange(event.target.value)} placeholder="내용" value={idea} />
      <button className={styles.button} disabled={!hasFolder || !title.trim() || !idea.trim() || isGenerating} onClick={onGenerate} type="button">{isGenerating ? "CLI 실행 중…" : "적용"}</button>
      {message ? <p className={styles.status}>{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section> : null}
    <div className={styles.documentActions}>
      <button aria-label={isPickingElement ? "선택 취소" : "요소 선택"} aria-pressed={isPickingElement} className={styles.pickerButton} disabled={!canPickElement} onClick={onToggleElementPicker} title={isPickingElement ? "선택 취소" : "요소 선택"} type="button"><MousePointer2 aria-hidden="true" size={20} /></button>
      <button aria-expanded={isOpen} aria-label={isOpen ? "문서 닫기" : "문서 확인 및 수정"} className={styles.documentButton} onClick={onToggle} ref={buttonRef} title={isOpen ? "문서 닫기" : "문서 확인 및 수정"} type="button"><FileText aria-hidden="true" size={20} /></button>
    </div>
  </div>;
}
