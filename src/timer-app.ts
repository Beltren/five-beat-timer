import { SECTIONS } from "./main";

/** Вспомогательный тип для таймера */
interface RunState {
  currentSection: number;
  sectionStart: number;      // Date.now()
  overtime: number | null;   // если вышли за лимит
}

export class FiveBeatTimerApp extends Application {
  /** Состояние работы */
  private _state: RunState = { currentSection: 0, sectionStart: Date.now(), overtime: null };
  private _raf?: number;

  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "five-beat-timer",
      title: "Session Timer",
      template: "modules/five-beat-timer/templates/timer.hbs",
      width: 350,
      height: 420,
      popOut: true,
      resizable: false
    });
  }

  /* ------------------- Лайф-цикл ------------------- */

  override activateListeners(html: JQuery) {
    html.find("button.next").on("click", () => this.advance());
    this.startTicker();
  }

  override close(options?: {}): Promise<void> {
    cancelAnimationFrame(this._raf!);
    return super.close(options);
  }

  /* ------------------- Логика ------------------- */

  /** Сдвинуться к следующей секции */
  private advance() {
    this._state.currentSection = Math.min(this._state.currentSection + 1, SECTIONS.length - 1);
    this._state.sectionStart = Date.now();
    this._state.overtime = null;
    this.render();
  }

  /** Основной тик — двигаем стрелку и проверяем задержку */
  private startTicker() {
    const tick = () => {
      const now = Date.now();
      const { currentSection, sectionStart } = this._state;
      const section = SECTIONS[currentSection];

      const elapsed = now - sectionStart;
      if (elapsed > section.durationMs && this._state.overtime === null) {
        this._state.overtime = 0;
      }
      if (this._state.overtime !== null) this._state.overtime += 16; // ~60 fps

      // обновляем DOM только раз в 500 мс чтобы не тормозить
      if (elapsed % 500 < 20) this.updateDial(elapsed);

      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  /** Поворот стрелки и вывод сообщения о задержке */
  private updateDial(elapsed: number) {
    const section = SECTIONS[this._state.currentSection];
    const progress = Math.min(elapsed / section.durationMs, 1);
    const angleDeg = this.sectionStartAngle() + 360 * progress;

    const root = this.element[0];
    root.style.setProperty("--pointer-rot", `${angleDeg}deg`);

    const notice = root.querySelector<HTMLDivElement>(".overtime");
    if (this._state.overtime !== null && notice) {
      const ms = this._state.overtime;
      const mm = Math.floor(ms / 60000)
        .toString()
        .padStart(2, "0");
      const ss = Math.floor((ms % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      notice.textContent = `${section.name} задерживается на ${mm}:${ss}`;
      notice.classList.remove("hidden");
    } else notice?.classList.add("hidden");
  }

  /** Сумма углов всех предыдущих секций */
  private sectionStartAngle() {
    const total = SECTIONS.reduce((a, s) => a + s.durationMs, 0);
    const past = SECTIONS.slice(0, this._state.currentSection).reduce((a, s) => a + s.durationMs, 0);
    return (past / total) * 360 - 90; // -90 чтобы 0 ° было на «12 часов»
  }

  /* ------------------- Шаблон ------------------- */

  override getData() {
    return {
      sections: SECTIONS,
      current: this._state.currentSection
    };
  }
}
