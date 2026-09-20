import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Brain, ChevronLeft, ChevronRight, Square } from "lucide-react";
import type { ReasoningEffort } from "../../../../../settings";
import { ideaBuilderStyles as styles } from "../styles";
import type { PromptComposerProps } from "../types";
import { DocumentComposer } from "./DocumentComposer";

const reasoningLevels = [null, "low", "medium", "high", "xhigh", "max"] as const;
const reasoningLabels = ["기본", "낮음", "보통", "높음", "매우 높음", "최대"] as const;

/** Displays the idea's chat sidebar and floating document editor. */
export function PromptComposer(props: PromptComposerProps) {
  const { title, hasFolder, error, onChat, chatInput, chatMessages, isReplying, onChatInputChange, isStopping, onStopChat, selectedElement, isPickingElement, onClearElement } = props;
  const { sidebar, progress, model, models, modelsLoading, modelPending, modelError, onSelectModel, reasoning, onSelectReasoning } = props;
  const selectedModel = models.find((item) => item.id === model);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);
  const reasoningPopoverRef = useRef<HTMLDivElement>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(() => reasoningLevels.indexOf(reasoning));
  const width = sidebar.collapsed ? 56 : sidebar.width;
  useEffect(() => { setReasoningStep(reasoningLevels.indexOf(reasoning)); }, [reasoning]);
  useEffect(() => { if (sidebar.collapsed) setReasoningOpen(false); }, [sidebar.collapsed]);
  useEffect(() => {
    if (!reasoningOpen) return;
    const closeOutside = (event: PointerEvent) => { if (!reasoningRef.current?.contains(event.target as Node) && !reasoningPopoverRef.current?.contains(event.target as Node)) setReasoningOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setReasoningOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [reasoningOpen]);
  const saveReasoning = (step: number) => onSelectReasoning(reasoningLevels[step] as ReasoningEffort | null);
  useEffect(() => {
    if (selectedElement && sidebar.collapsed) sidebar.toggle();
  }, [selectedElement]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const messages = chatMessagesRef.current;
      if (messages) messages.scrollTop = messages.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [chatMessages, isReplying, progress, sidebar.collapsed]);
  return <>
    <aside aria-label="아이디어 대화" className={`${styles.chatSidebar} ${sidebar.dragging ? "" : styles.sidebarMotion}`} style={{ width, height: sidebar.collapsed ? 56 : "calc(100vh - 32px)" }}>
      <div className={styles.chatSidebarHeader}>
        <button aria-label={sidebar.collapsed ? "대화 펼치기" : "대화 접기"} aria-expanded={!sidebar.collapsed} aria-controls="idea-chat-content" className={styles.sidebarToggle} onClick={sidebar.toggle} type="button">{sidebar.collapsed ? <ChevronLeft aria-hidden="true" size={20} /> : <ChevronRight aria-hidden="true" size={20} />}</button>
        {!sidebar.collapsed ? <span className={styles.chatSidebarTitle}>{title ? title + " · 대화" : "대화"}</span> : null}
      </div>
      <div inert={sidebar.collapsed} aria-hidden={sidebar.collapsed} id="idea-chat-content" className={sidebar.collapsed ? styles.chatSidebarBodyCollapsed : styles.chatSidebarBodyExpanded} style={{ minWidth: sidebar.width }}>
        <div aria-live="polite" className={styles.chatMessages} ref={chatMessagesRef}>
          {chatMessages.length ? chatMessages.map((item, index) => <p className={item.role === "user" ? styles.userBubble : styles.agentBubble} key={index}>{item.selectedElement ? <span className={styles.messageElement}>선택 요소 · depth {item.selectedElement.depth}<br />{item.selectedElement.selector}</span> : null}{item.content}</p>) : <p className={styles.chatEmpty}>{hasFolder ? "선택한 AI에게 현재 작업에 대해 물어보세요." : "먼저 작업 폴더를 선택해 주세요."}</p>}
          {isReplying ? <div className={styles.progressPanel} role="status">
            <p className={styles.progressTitle}>{isStopping ? "중단 중…" : "작업 진행 상황"}</p>
            {progress.length ? <ul className={styles.progressList}>{progress.slice(-6).map((item) => <li className={styles.progressItem} key={item.id}><span>{item.label}</span><span>{item.status === "completed" ? "완료" : item.status === "failed" ? "실패" : "진행 중"}</span></li>)}</ul> : null}
            {!isStopping && !progress.some((item) => item.status === "running") ? <p className={styles.progressWaiting}>CLI의 다음 응답을 기다리는 중…</p> : null}
          </div> : null}
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {isPickingElement ? <p className={styles.elementSelection} role="status">미리보기에서 수정할 요소를 클릭하세요. Esc로 취소할 수 있습니다.</p> : null}
        {selectedElement ? <div className={styles.elementSelection} aria-live="polite"><div className={styles.elementHeader}><span>선택 요소 · depth {selectedElement.depth} (html = 0)</span><button aria-label="선택 요소 해제" className={styles.sidebarToggle} onClick={onClearElement} type="button">×</button></div><code className={styles.elementPath}>{selectedElement.selector}</code></div> : null}
        <div className={styles.chatInputRow}>
          <textarea aria-label="대화 메시지" className={styles.chatInput} disabled={!hasFolder} onChange={(event) => onChatInputChange(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
              event.preventDefault();
              if (!event.repeat && hasFolder && !isReplying) void onChat();
            }
          }} placeholder="메시지를 입력하세요" value={chatInput} />
          <div className={styles.chatInputActions}>
            <select aria-label="대화 모델 선택" className={styles.chatModelSelect} disabled={modelsLoading || modelPending} onChange={(event) => onSelectModel(event.target.value || null)} value={model ?? ""}>
              <option value="">CLI 기본 설정</option>
              {model && !selectedModel ? <option disabled value={model}>{model} (목록에서 확인되지 않음)</option> : null}
              {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className={styles.reasoningControl} ref={reasoningRef}>
              <button aria-expanded={reasoningOpen} aria-label={`추론 수준: ${reasoningLabels[reasoningLevels.indexOf(reasoning)]}`} aria-haspopup="dialog" className={styles.reasoningButton} disabled={modelPending} onClick={() => setReasoningOpen((open) => !open)} title="추론 수준 설정" type="button"><Brain aria-hidden="true" size={18} /></button>
            </div>
            {isReplying ? <button aria-label={isStopping ? "응답 중단 중" : "응답 중단"} className={styles.stopButton} disabled={isStopping} onClick={() => void onStopChat()} type="button"><Square aria-hidden="true" size={12} fill="currentColor" /></button> : <button aria-label="메시지 보내기" className={styles.sendButton} disabled={!hasFolder || !chatInput.trim()} onClick={() => void onChat()} type="button"><ArrowUp aria-hidden="true" size={16} /></button>}
          </div>
        </div>
        {modelError ? <p className={styles.chatModelError} role="alert">{modelError}</p> : null}
      </div>
      {!sidebar.collapsed ? <div aria-label="대화 사이드바 폭 조절" aria-controls="idea-chat-content" aria-orientation="vertical" aria-valuemin={sidebar.minWidth} aria-valuemax={sidebar.maxWidth} aria-valuenow={sidebar.width} className={styles.chatSidebarResize} role="separator" tabIndex={0} {...sidebar.resizeHandlers} /> : null}
    </aside>
    {reasoningOpen && reasoningRef.current ? createPortal(<div aria-label="추론 수준 설정" className={styles.reasoningPopover} ref={reasoningPopoverRef} role="dialog" style={{ bottom: window.innerHeight - reasoningRef.current.getBoundingClientRect().top + 12, right: window.innerWidth - reasoningRef.current.getBoundingClientRect().right }}>
      <div className={styles.reasoningHeader}><span>추론 수준</span><strong>{reasoningLabels[reasoningStep]}</strong></div>
      <input aria-label="추론 수준" autoFocus className={styles.reasoningSlider} disabled={modelPending} max={reasoningLevels.length - 1} min={0} onBlur={(event) => saveReasoning(Number(event.currentTarget.value))} onChange={(event) => setReasoningStep(Number(event.target.value))} onKeyUp={(event) => saveReasoning(Number(event.currentTarget.value))} onPointerUp={(event) => saveReasoning(Number(event.currentTarget.value))} step={1} type="range" value={reasoningStep} />
      <div aria-hidden="true" className={styles.reasoningScale}><span>기본</span><span>최대</span></div>
    </div>, document.body) : null}
    {sidebar.dragging ? createPortal(<div aria-hidden="true" className={styles.sidebarResizeOverlay} />, document.body) : null}
    <DocumentComposer {...props} rightOffset={width + 32} />
  </>;
}
