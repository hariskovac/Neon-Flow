import type { ConsentRecord } from "../types/game";
import {
  CONSENT_DECLARATIONS,
  CONSENT_QUESTIONS,
  INFORMATION_SHEET,
  STUDY_CONTACTS,
} from "./consentContent";

export class ConsentFlow {
  private readonly root: HTMLElement;
  private resolveFlow: ((record: ConsentRecord) => void) | null = null;

  public constructor(root: HTMLElement) {
    this.root = root;
  }

  public start(): Promise<ConsentRecord> {
    return new Promise<ConsentRecord>((resolve) => {
      this.resolveFlow = resolve;

      this.root.hidden = false;
      this.showInformationSheet();
    });
  }

  private showInformationSheet(): void {
    const page = this.createPage();

    page.append(this.createHeading("Study Information"));
    page.append(this.createSubheading("MSc Individual Project (COMSM3201)"));
    page.append(this.createContactBlock());

    for (const section of INFORMATION_SHEET) {
      if (section.heading !== null) {
        page.append(this.createSectionHeading(section.heading));
      }

      for (const text of section.paragraphs) {
        page.append(this.createParagraph(text));
      }

      if (section.bullets !== undefined) {
        const list = document.createElement("ul");

        for (const item of section.bullets) {
          const entry = document.createElement("li");

          entry.textContent = item;
          list.append(entry);
        }

        page.append(list);
      }
    }

    page.append(this.createParagraph("Yours faithfully,"));
    page.append(this.createParagraph(STUDY_CONTACTS.studentName));

    const actions = document.createElement("div");

    actions.className = "consent-actions";

    const proceed = this.createButton("Continue to consent form", () => {
      this.showConsentForm();
    });

    actions.append(proceed);
    page.append(actions);

    this.render(page);
  }

  private showConsentForm(): void {
    const page = this.createPage();

    page.append(this.createHeading("Participant Consent Form"));
    page.append(
      this.createSubheading(
        "Please answer the following questions to the best of your knowledge.",
      ),
    );

    const form = document.createElement("div");

    form.className = "consent-questions";

    for (const question of CONSENT_QUESTIONS) {
      if (question.groupHeading !== undefined) {
        form.append(this.createSectionHeading(question.groupHeading));
      }

      form.append(this.createQuestionRow(question.id, question.text));
    }

    page.append(form);

    page.append(
      this.createSectionHeading(
        "I hereby fully and freely consent to my participation in this study",
      ),
    );

    const declarations = document.createElement("ul");

    declarations.className = "consent-declarations";

    for (const text of CONSENT_DECLARATIONS) {
      const entry = document.createElement("li");

      entry.textContent = text;
      declarations.append(entry);
    }

    page.append(declarations);

    const signature = this.createTextField(
      "signature",
      "Signature (type your full name)",
    );

    const printedName = this.createTextField(
      "printedName",
      "Name in BLOCK letters",
    );

    page.append(signature.wrapper);
    page.append(printedName.wrapper);

    const error = document.createElement("p");

    error.className = "consent-error";
    error.setAttribute("role", "alert");

    page.append(error);

    const actions = document.createElement("div");

    actions.className = "consent-actions";

    actions.append(
      this.createButton("I consent — begin the study", () => {
        this.submit(signature.input, printedName.input, error);
      }),
    );

    actions.append(
      this.createButton("I do not consent", () => {
        this.showDeclined();
      }, "consent-button-secondary"),
    );

    page.append(actions);

    this.render(page);
  }

  // validates and completes the form
  private submit(
    signature: HTMLInputElement,
    printedName: HTMLInputElement,
    error: HTMLElement,
  ): void {
    const answers: Record<string, boolean> = {};
    const unanswered: string[] = [];
    const refused: string[] = [];

    for (const question of CONSENT_QUESTIONS) {
      const yes = document.querySelector<HTMLInputElement>(
        `input[name="${question.id}"][value="yes"]`,
      );

      const no = document.querySelector<HTMLInputElement>(
        `input[name="${question.id}"][value="no"]`,
      );

      if (yes?.checked === true) {
        answers[question.id] = true;
      } else if (no?.checked === true) {
        answers[question.id] = false;
        refused.push(question.id);
      } else {
        unanswered.push(question.id);
      }
    }

    if (unanswered.length > 0) {
      error.textContent = "Please answer every question before continuing.";

      return;
    }

    if (refused.length > 0) {
      this.showIneligible();

      return;
    }

    if (signature.value.trim() === "" || printedName.value.trim() === "") {
      error.textContent =
        "Please provide both your signature and your name in block letters.";

      return;
    }

    error.textContent = "";

    this.complete({
      answers,
      signature: signature.value.trim(),
      printedName: printedName.value.trim(),
      signedAt: new Date().toISOString(),
    });
  }

  private showIneligible(): void {
    const page = this.createPage();

    page.append(this.createHeading("Thank you for your interest"));

    page.append(
      this.createParagraph(
        "Based on your answers, this study is not able to proceed at this time. This is not a reflection on you, and no data has been recorded.",
      ),
    );

    page.append(
      this.createParagraph(
        `If you would like to ask any questions before deciding, please contact ${STUDY_CONTACTS.studentEmail} or ${STUDY_CONTACTS.lecturerEmail}. You may reload this page if you would like to review the information sheet again.`,
      ),
    );

    this.render(page);
  }

  private showDeclined(): void {
    const page = this.createPage();

    page.append(this.createHeading("Thank you for your time"));

    page.append(
      this.createParagraph(
        "You have chosen not to take part, and no data has been recorded. You may now close this page.",
      ),
    );

    this.render(page);
  }

  private complete(record: ConsentRecord): void {
    this.root.innerHTML = "";
    this.root.hidden = true;

    this.resolveFlow?.(record);
    this.resolveFlow = null;
  }

  private render(page: HTMLElement): void {
    this.root.innerHTML = "";
    this.root.append(page);
    this.root.hidden = false;

    window.scrollTo(0, 0);
  }

  private createPage(): HTMLElement {
    const page = document.createElement("article");

    page.className = "consent-page";

    return page;
  }

  private createHeading(text: string): HTMLElement {
    const heading = document.createElement("h1");

    heading.textContent = text;

    return heading;
  }

  private createSubheading(text: string): HTMLElement {
    const heading = document.createElement("p");

    heading.className = "consent-subheading";
    heading.textContent = text;

    return heading;
  }

  private createSectionHeading(text: string): HTMLElement {
    const heading = document.createElement("h2");

    heading.textContent = text;

    return heading;
  }

  private createParagraph(text: string): HTMLElement {
    const paragraph = document.createElement("p");

    paragraph.textContent = text;

    return paragraph;
  }

  private createContactBlock(): HTMLElement {
    const block = document.createElement("div");

    block.className = "consent-contacts";

    block.append(
      this.createParagraph(
        `Student: ${STUDY_CONTACTS.studentName} — ${STUDY_CONTACTS.studentEmail}`,
      ),
    );

    block.append(
      this.createParagraph(
        `Supervisor: ${STUDY_CONTACTS.lecturerName} — ${STUDY_CONTACTS.lecturerEmail}`,
      ),
    );

    return block;
  }

  private createQuestionRow(id: string, text: string): HTMLElement {
    const row = document.createElement("div");

    row.className = "consent-question";

    const label = document.createElement("span");

    label.className = "consent-question-text";
    label.id = `${id}-label`;
    label.textContent = text;

    const options = document.createElement("div");

    options.className = "consent-options";
    options.setAttribute("role", "radiogroup");
    options.setAttribute("aria-labelledby", `${id}-label`);

    for (const value of ["yes", "no"]) {
      const wrapper = document.createElement("label");

      wrapper.className = "consent-option";

      const input = document.createElement("input");

      input.type = "radio";
      input.name = id;
      input.value = value;

      const caption = document.createElement("span");

      caption.textContent = value === "yes" ? "Yes" : "No";

      wrapper.append(input, caption);
      options.append(wrapper);
    }

    row.append(label, options);

    return row;
  }

  private createTextField(
    id: string,
    labelText: string,
  ): { wrapper: HTMLElement; input: HTMLInputElement } {
    const wrapper = document.createElement("div");

    wrapper.className = "consent-field";

    const label = document.createElement("label");

    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement("input");

    input.type = "text";
    input.id = id;
    input.autocomplete = "off";

    wrapper.append(label, input);

    return { wrapper, input };
  }

  private createButton(
    text: string,
    onClick: () => void,
    className = "consent-button",
  ): HTMLElement {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);

    return button;
  }
}