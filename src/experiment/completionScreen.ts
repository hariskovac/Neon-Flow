import { STUDY_CONTACTS } from "../consent/consentContent";
export interface CompletionOptions {
  readonly saved: boolean;
}

export function showCompletion(
  root: HTMLElement,
  options: CompletionOptions,
): Promise<void> {
  return new Promise<void>((resolve) => {
    root.innerHTML = "";
    root.hidden = false;

    const page = document.createElement("article");

    page.className = "gate-page";

    const heading = document.createElement("h1");

    heading.textContent = "Thank you for completing the survey!";
    page.append(heading);

    const outcome = document.createElement("p");

    outcome.textContent = options.saved
      ? "Your responses have been recorded."
      : "Your responses could not be saved. The study is complete and nothing further is needed of you. Thank you for your participation.";

    page.append(outcome);

    const contact = document.createElement("p");

    contact.className = "completion-contact";
    contact.textContent = `If you have any questions about the study, you can contact ${STUDY_CONTACTS.studentEmail} or ${STUDY_CONTACTS.lecturerEmail}.`;

    page.append(contact);

    const closing = document.createElement("p");

    closing.textContent =
      "You may now close this tab. If you would like to keep playing, you can start another round.";

    page.append(closing);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "consent-button-secondary";
    button.textContent = "Play another round";

    button.addEventListener("click", () => {
      root.innerHTML = "";
      root.hidden = true;

      resolve();
    });

    page.append(button);

    root.append(page);

    window.scrollTo(0, 0);
  });
}