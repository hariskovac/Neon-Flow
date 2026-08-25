export interface InformationSection {
  readonly heading: string | null;
  readonly paragraphs: string[];
  readonly bullets?: string[];
}

export const STUDY_CONTACTS = {
  studentName: "Haris Kovac",
  studentEmail: "yw25220@bristol.ac.uk",
  lecturerName: "Pete Bennett",
  lecturerEmail: "pete.bennett@bristol.ac.uk",
};

export const INFORMATION_SHEET: InformationSection[] = [
  {
    heading: null,
    paragraphs: [
      "Dear Participant,",
      "I am a student in Computer Science at the University of Bristol, currently developing a study on how Dynamic Difficulty Adjustment (DDA) affects perceived fairness, competence, autonomy, and enjoyment as part of my final project. To evaluate the project, I am engaging participants to play a short arena shooter game and respond to a brief multiple-choice questionnaire at the end. The data collected includes performance telemetry data and responses to the questionnaire. By engaging potential users in this interactive prototype, I hope to ensure that my design is both useful and usable.",
    ],
  },
  {
    heading: "Participation",
    paragraphs: [],
    bullets: [
      "Participants should be over 18 and should be able to provide written consent on the form provided.",
      "Participation in this study is voluntary. If you decide to take part, you will be asked to provide written consent. You are free to withdraw during the study at any time and without having to give a reason.",
    ],
  },
  {
    heading: "Risks and Disadvantages",
    paragraphs: [
      "There are no known risks associated with completion of the questionnaire.",
    ],
  },
  {
    heading: "Data management and Confidentiality",
    paragraphs: [
      "No personally identifying information (PII) will be recorded on the questionnaire or during any part of the study. Any information recorded as part of the consent process will be kept strictly confidential by the development teams and the lecturing staff. Any final write-ups of the data gathered will not include any information that can be linked directly to you.",
      "All data will be stored so that no PII is associated with it (using an arbitrary participant number) and no photographs, audio recordings, or video recordings will be made. All data will be handled confidentially and anonymously. The data collected from this study will be used in a coursework submission to the University of Bristol. Results from the research will be presented in accordance with rules for anonymity such that the results cannot be traced to individual participants.",
      "If you have any questions about the management of your data, please do not hesitate to ask.",
    ],
  },
  {
    heading: "Right to Withdraw",
    paragraphs: [
      "You are free to withdraw from the study at any time without penalty. Withdrawal from the study will not affect your academic status or your access to services at the University of Bristol. If you withdraw, all of your non-anonymized data held by the student will be deleted from the study and destroyed. Please note that data can only be withdrawn up until the point that the data is anonymised; after this time your data cannot be identified. In addition, you are free to not answer specific questions in the interviews or on the questionnaire.",
      "Your continued participation should be as informed as your initial consent, so you should feel free to ask for clarification or new information throughout your participation. If you have further questions concerning matters related to this research, please contact us by emailing both the Lecturer and student using the details given at the top of this page.",
    ],
  },
  {
    heading: "Questions",
    paragraphs: [
      "If you have any questions concerning the study, please feel free to ask at any point; you are also free to contact us with the details provided above if you have questions at a later time. This study has been approved on ethical grounds by the University of Bristol Faculty of Engineering Ethics Board. Any questions regarding your rights as a participant may be addressed to that committee through the Faculty Ethics Officer (http://www.bris.ac.uk/red/support/governance/ethics/ethics.html). Please note that you are free to withdraw from participation at any time.",
      "Thank you for your interest and cooperation. If you would like more information about the research project, please feel free to make contact.",
    ],
  },
];

export interface ConsentQuestion {
  readonly id: string;
  readonly text: string;
  readonly groupHeading?: string;
}

export const CONSENT_QUESTIONS: ConsentQuestion[] = [
  {
    id: "givenInformation",
    groupHeading: "Have you:",
    text: "Been given information explaining about the study?",
  },
  {
    id: "hadOpportunityToAsk",
    text: "Had an opportunity to ask questions and discuss this study?",
  },
  {
    id: "receivedAnswers",
    text: "Received satisfactory answers to all questions you asked?",
  },
  {
    id: "receivedEnoughInformation",
    text: "Received enough information about the study for you to make a decision about your participation?",
  },
  {
    id: "noPreventingCondition",
    text: "Ascertained that you don't have any known condition that prevents you from taking part in this study?",
  },
  {
    id: "withdrawAnyTime",
    groupHeading:
      "Do you understand that you are free to withdraw from the study and free to withdraw your data prior to final consent:",
    text: "At any time?",
  },
  {
    id: "withdrawWithoutReason",
    text: "Without having to give a reason for withdrawing?",
  },
];

export const CONSENT_DECLARATIONS: string[] = [
  "I understand the nature and purpose of the procedures involved in this study. These have been communicated to me on the information sheet accompanying this form.",
  "I understand and acknowledge that the investigation is designed to promote scientific knowledge and that the University of Bristol will use the data I provide for no purpose other than teaching and research.",
  "I understand the data I provide will be anonymous. No link will be made between my name or other identifying information and my study data.",
  "I understand that the University of Bristol may use the data collected for this study in a future research project but that the conditions on this form under which I have provided the data will still apply.",
  "I agree to the University of Bristol keeping and processing the data I have provided during the course of this study. I understand that this data will be used only for the purpose(s) set out in the information sheet, and my consent is conditional upon the University complying with its duties and obligations under GDPR.",
];