import { useEffect, useState } from "react";
import type { CliProvider } from "../../../../settings";
import type { ReasoningEffort } from "../../../../settings";
import type { CliModel } from "../../../../cli-models";

export function useSettings() {
  const [provider, setProvider] = useState<CliProvider>("codex");
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Record<CliProvider, string | null>>({ codex: null, claude: null });
  const [selectedReasoning, setSelectedReasoning] = useState<Record<CliProvider, ReasoningEffort | null>>({ codex: null, claude: null });
  const [models, setModels] = useState<CliModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setModels([]);
    setModelsLoading(true);
    setModelsError(null);
    Promise.resolve().then(() => window.desktop.listCliModels(provider))
      .then((result) => { if (active) setModels(result); })
      .catch((caught) => { if (active) setModelsError(caught instanceof Error ? caught.message : "모델 목록을 불러오지 못했습니다."); })
      .finally(() => { if (active) setModelsLoading(false); });
    return () => { active = false; };
  }, [provider, refresh]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (window.desktop.apiVersion !== 11) throw new Error("앱을 완전히 종료한 뒤 다시 실행해 주세요.");
      return window.desktop.getSettings();
    }).then((settings) => { if (active) { setProvider(settings.cliProvider); setSelectedModels(settings.models); setSelectedReasoning(settings.reasoning); } })
      .catch(() => { if (active) setError("설정을 불러오지 못했습니다. 앱을 다시 실행해 주세요."); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, []);
  const selectProvider = async (next: CliProvider) => {
    if (pending || provider === next) return;
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      if (window.desktop.apiVersion !== 11) throw new Error("설정을 사용하려면 앱을 완전히 종료한 뒤 다시 실행해 주세요.");
      const settings = await window.desktop.setCliProvider(next);
      setProvider(settings.cliProvider);
      setSelectedModels(settings.models);
      setSelectedReasoning(settings.reasoning);
      setSaved(true);
    } catch (caught) { setError(window.desktop.apiVersion !== 11 && caught instanceof Error ? caught.message : "설정을 저장하지 못했습니다. 다시 시도해 주세요."); }
    finally { setPending(false); }
  };
  const selectModel = async (model: string | null) => {
    if (pending || selectedModels[provider] === model) return;
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const settings = await window.desktop.setCliModel(provider, model);
      setSelectedModels(settings.models);
      setSelectedReasoning(settings.reasoning);
      setSaved(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "모델을 저장하지 못했습니다."); }
    finally { setPending(false); }
  };
  const selectReasoning = async (effort: ReasoningEffort | null) => {
    if (pending || selectedReasoning[provider] === effort) return;
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const settings = await window.desktop.setCliReasoning(provider, effort);
      setSelectedReasoning(settings.reasoning);
      setSaved(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "추론 수준을 저장하지 못했습니다."); }
    finally { setPending(false); }
  };
  return { provider, pending, error, saved, selectProvider, model: selectedModels[provider], models, modelsLoading, modelsError, selectModel, reasoning: selectedReasoning[provider], selectReasoning, refreshModels: () => setRefresh((value) => value + 1) };
}
