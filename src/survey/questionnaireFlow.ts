import { session } from "../experiment/SessionManager";
import type { QuestionnaireResponse, ScaleItem } from "../types/game";
import {
  BACKGROUND_QUESTIONS,
  EXPERIENCE_ITEM,
  MANIPULATION_CHECK_ITEMS,
  QUESTIONNAIRE_INTRO,
  SCALE_ANCHORS,
  SCALE_ITEMS,
  SCALE_MAX,
  SCALE_MIN,
  TRANSPARENCY_ITEMS,
} from "./questionnaireContent";

export class QuestionnaireFlow {
  private readonly root: HTMLElement;
  private resolveFlow: ((response: QuestionnaireResponse) => void) | null = null;

  public constructor(root: HTMLElement) {
    this.root = root;
  }

  public start(): Promise<QuestionnaireResponse> {
    return new Promise<QuestionnaireResponse>((resolve) => {
      this.resolveFlow = resolve;

      this.render();
    });
  }

  private render(): void {
    const page = document.createElement("article");

    page.className = "survey-page";

    const heading = document.createElement("h1");

    heading.textContent = "A few questions about the game";
    page.append(heading);

    const intro = document.createElement("p");

    intro.className = "survey-intro";
    intro.textContent = QUESTIONNAIRE_INTRO;
    page.append(intro);

    page.append(this.createScaleLegend());

    for (const item of SCALE_ITEMS) {
      page.append(this.createScaleRow(item));
    }

    page.append(this.createSectionHeading("About the game's difficulty"));

    for (const item of MANIPULATION_CHECK_ITEMS) {
      page.append(this.createScaleRow(item));
    }

    if (session.isTransparent()) {
      page.append(
        this.createSectionHeading("About the between-wave information"),
      );

      for (const item of TRANSPARENCY_ITEMS) {
        page.append(this.createScaleRow(item));
      }
    }

    page.append(this.createSectionHeading("About your gaming background"));

    for (const question of BACKGROUND_QUESTIONS) {
      page.append(this.createChoiceRow(question.id, question.text, question.options));
    }

    page.append(
      this.createScaleRow(
        {
          id: EXPERIENCE_ITEM.id,
          construct: "competence",
          text: EXPERIENCE_ITEM.text,
        },
        EXPERIENCE_ITEM.anchors,
      ),
    );

    const notice = document.createElement("p");

    notice.className = "survey-notice";
    notice.setAttribute("role", "status");

    page.append(notice);

    const actions = document.createElement("div");

    actions.className = "survey-actions";

    actions.append(
      this.createButton("Submit and finish", () => {
        this.submit(notice);
      }),
    );

    page.append(actions);

    this.root.innerHTML = "";
    this.root.append(page);
    this.root.hidden = false;

    window.scrollTo(0, 0);
  }

  private submit(notice: HTMLElement): void {
    const scaleResponses: Record<string, number> = {};
    const choiceResponses: Record<string, string> = {};

    const allScaleItems = [
      ...SCALE_ITEMS,
      ...MANIPULATION_CHECK_ITEMS,
      ...(session.isTransparent() ? TRANSPARENCY_ITEMS : []),
    ];

    let unanswered = 0;

    for (const item of allScaleItems) {
      const value = this.readScaleValue(item.id);

      if (value === null) {
        unanswered += 1;
      } else {
        scaleResponses[item.id] = value;
      }
    }

    const experience = this.readScaleValue(EXPERIENCE_ITEM.id);

    if (experience === null) {
      unanswered += 1;
    } else {
      scaleResponses[EXPERIENCE_ITEM.id] = experience;
    }

    for (const question of BACKGROUND_QUESTIONS) {
      const selected = document.querySelector<HTMLInputElement>(
        `input[name="${question.id}"]:checked`,
      );

      if (selected === null) {
        unanswered += 1;
      } else {
        choiceResponses[question.id] = selected.value;
      }
    }

    if (unanswered > 0 && notice.dataset.warned !== "true") {
      notice.dataset.warned = "true";
      notice.textContent =
        `${String(unanswered)} question${unanswered === 1 ? " has" : "s have"} not been answered. ` +
        "You may leave any question blank — press Submit again to continue.";

      return;
    }

    this.complete({
      scaleResponses,
      choiceResponses,
      unansweredCount: unanswered,
      submittedAt: new Date().toISOString(),
    });
  }

  private readScaleValue(id: string): number | null {
    const selected = document.querySelector<HTMLInputElement>(
      `input[name="${id}"]:checked`,
    );

    if (selected === null) {
      return null;
    }

    return Number.parseInt(selected.value, 10);
  }

  private complete(response: QuestionnaireResponse): void {
    this.root.innerHTML = "";
    this.root.hidden = true;

    this.resolveFlow?.(response);
    this.resolveFlow = null;
  }

  private createScaleLegend(): HTMLElement {
    const legend = document.createElement("div");

    legend.className = "survey-legend";

    SCALE_ANCHORS.forEach((anchor, index) => {
      const entry = document.createElement("span");

      entry.textContent = `${String(index + 1)} = ${anchor}`;
      legend.append(entry);
    });

    return legend;
  }

  private createSectionHeading(text: string): HTMLElement {
    const heading = document.createElement("h2");

    heading.textContent = text;

    return heading;
  }

  private createScaleRow(
    item: ScaleItem,
    anchors: string[] = [SCALE_ANCHORS[0], SCALE_ANCHORS[SCALE_ANCHORS.length - 1]],
  ): HTMLElement {
    const row = document.createElement("div");

    row.className = "survey-item";

    const label = document.createElement("p");

    label.className = "survey-item-text";
    label.id = `${item.id}-label`;
    label.textContent = item.text;

    const options = document.createElement("div");

    options.className = "survey-scale";
    options.setAttribute("role", "radiogroup");
    options.setAttribute("aria-labelledby", `${item.id}-label`);

    const low = document.createElement("span");

    low.className = "survey-anchor";
    low.textContent = anchors[0];
    options.append(low);

    for (let value = SCALE_MIN; value <= SCALE_MAX; value += 1) {
      const wrapper = document.createElement("label");

      wrapper.className = "survey-point";

      const input = document.createElement("input");

      input.type = "radio";
      input.name = item.id;
      input.value = String(value);
      input.setAttribute("aria-label", `${String(value)}`);

      const caption = document.createElement("span");

      caption.textContent = String(value);

      wrapper.append(input, caption);
      options.append(wrapper);
    }

    const high = document.createElement("span");

    high.className = "survey-anchor";
    high.textContent = anchors[anchors.length - 1];
    options.append(high);

    row.append(label, options);

    return row;
  }

  private createChoiceRow(
    id: string,
    text: string,
    options: string[],
  ): HTMLElement {
    const row = document.createElement("div");

    row.className = "survey-item survey-item-choice";

    const label = document.createElement("p");

    label.className = "survey-item-text";
    label.id = `${id}-label`;
    label.textContent = text;

    const list = document.createElement("div");

    list.className = "survey-choices";
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-labelledby", `${id}-label`);

    for (const option of options) {
      const wrapper = document.createElement("label");

      wrapper.className = "survey-choice";

      const input = document.createElement("input");

      input.type = "radio";
      input.name = id;
      input.value = option;

      const caption = document.createElement("span");

      caption.textContent = option;

      wrapper.append(input, caption);
      list.append(wrapper);
    }

    row.append(label, list);

    return row;
  }

  private createButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "consent-button";
    button.textContent = text;
    button.addEventListener("click", onClick);

    return button;
  }
}