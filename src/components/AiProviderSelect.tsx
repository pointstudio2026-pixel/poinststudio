const PROVIDER_LABELS: Record<string, string> = {
  openai: "GPT (OpenAI)",
  gemini: "Gemini (Google)",
  claude: "Claude (Anthropic)",
};

export function AiProviderSelect({
  value,
  onChange,
  providers,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  providers: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
    >
      <option value="">AI 모델: 자동</option>
      {providers.map((p) => (
        <option key={p} value={p}>
          {PROVIDER_LABELS[p] ?? p}
        </option>
      ))}
    </select>
  );
}
