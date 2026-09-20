import { settingsStyles as styles } from "./styles";
import type { SettingsPageProps } from "./types";

export function SettingsPage(props: SettingsPageProps) {
  const { provider, pending, error, saved, onSelect, onBack, model, models, modelsLoading, modelsError, onSelectModel, onRefreshModels } = props;
  const selectedModel = models.find((item) => item.id === model);
  return <section aria-labelledby="settings-title" className={styles.root}>
    <div className={styles.content}>
      <button className={styles.back} onClick={onBack} type="button">← 작업으로 돌아가기</button>
      <h1 className={styles.title} id="settings-title">설정</h1>
      <p className={styles.description}>아이디어를 함께 만들 AI 도구를 선택하세요.</p>
      <fieldset className={styles.group} disabled={pending}>
        <legend className={styles.legend}>사용할 CLI</legend>
        {([{ id: "codex", name: "Codex CLI", description: "OpenAI의 Codex로 대화하고 화면을 만듭니다." }, { id: "claude", name: "Claude CLI", description: "Anthropic의 Claude Code로 대화하고 화면을 만듭니다." }] as const).map((option) =>
          <label className={styles.option} key={option.id}>
            <input checked={provider === option.id} className={styles.radio} name="cli-provider" onChange={() => onSelect(option.id)} type="radio" value={option.id} />
            <span><span className={styles.name}>{option.name}</span><span className={styles.detail}>{option.description}</span></span>
          </label>
        )}
        <div className={styles.modelHeader}>
          <label className={styles.name} htmlFor="cli-model">사용할 모델</label>
          <button className={styles.refresh} disabled={modelsLoading} onClick={onRefreshModels} type="button">목록 새로고침</button>
        </div>
        <select aria-describedby="model-description" className={styles.select} disabled={modelsLoading} id="cli-model" onChange={(event) => onSelectModel(event.target.value || null)} value={model ?? ""}>
          <option value="">CLI 기본 설정 사용</option>
          {model && !selectedModel ? <option disabled value={model}>{model} (저장된 모델 · 목록에서 확인되지 않음)</option> : null}
          {models.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.id}</option>)}
        </select>
        <p aria-live="polite" className={styles.note} id="model-description">{modelsLoading ? "CLI에서 사용 가능한 모델을 조회하는 중…" : selectedModel?.description || "CLI가 제공하는 모델 목록입니다. 실제 사용 권한과 한도는 로그인한 계정에 따라 달라집니다."}</p>
        {modelsError ? <p className={styles.error} role="alert">{modelsError}</p> : null}
        <p className={styles.note}>선택하면 자동으로 저장되며 다음 요청부터 적용됩니다.<br />CLI별 모델 선택과 대화는 각각 유지됩니다. 기본 설정으로 되돌리면 다음 요청은 새 대화로 시작합니다.<br />선택한 CLI가 컴퓨터에 설치되어 있고, 터미널에서 로그인되어 있어야 합니다.</p>
      </fieldset>
      <p aria-live="polite" className={styles.status}>{pending ? "설정을 불러오거나 저장하는 중…" : saved ? "설정이 저장되었습니다." : ""}</p>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  </section>;
}
