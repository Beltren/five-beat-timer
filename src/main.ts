import { FiveBeatTimerApp } from "./timer-app";
import yaml from "js-yaml";

/** Глобально храним конфиг и экземпляр таймера */
interface Section {
  name: string;
  color: string;
  durationMs: number;
}
export let SECTIONS: Section[] = [];

Hooks.once("init", async () => {
  /** Загружаем и парсим YAML в assets/data */
  const response = await fetch("modules/five-beat-timer/timer-config.yml");
  const raw = await response.text();
  const parsed = yaml.load(raw) as { sections: { name: string; color: string; duration: string }[] };

  // конвертация 5m, 30s и т.п. → миллисекунды
  SECTIONS = parsed.sections.map((s) => {
    const match = s.duration.match(/(\d+)(s|m|h)/i);
    const value = Number(match?.[1] ?? 0);
    const unit = match?.[2].toLowerCase();
    const factor = unit === "h" ? 3_600_000 : unit === "m" ? 60_000 : 1000;
    return { name: s.name, color: s.color, durationMs: value * factor };
  });
});

Hooks.once("ready", () => {
  new FiveBeatTimerApp().render(true);
});
