import { CHARACTERS, STORY_FLAG } from "@/lib/characters";
import { checkInLine, toneReply } from "@/lib/banter";
import type { CharacterId, SaveState, Scene, ScenePlace, ScriptChoice, ScriptNode, Tone } from "@/lib/types";

function scene(
  partial: Omit<Scene, "nodes" | "entry"> & { entry: string; nodes: ScriptNode[] },
): Scene {
  const { nodes, ...rest } = partial;
  return { ...rest, nodes: Object.fromEntries(nodes.map((node) => [node.id, node])) };
}

function endNode(id: string, speaker: ScriptNode["speaker"], text: string, end: "romantic" | "talk" | "leave"): ScriptNode {
  return {
    id,
    speaker,
    text,
    choices: [
      {
        id: `${id}-close`,
        text: end === "leave" ? "Say goodnight" : end === "romantic" ? "Let the moment fade softly" : "Leave the evening there",
        tone: end === "romantic" ? "flirtatious" : "friendly",
        effects: { end, completeScene: true },
      },
    ],
  };
}

const choice = (
  id: string,
  text: string,
  tone: Tone,
  next: string,
  effects?: ScriptChoice["effects"],
): ScriptChoice => ({ id, text, tone, next, effects });

export const SCENES: Scene[] = [
  scene({
    id: "bar-reina",
    title: "A fair fight",
    characterId: "reina",
    place: "bar",
    once: true,
    flag: STORY_FLAG.reina,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "reina",
        text: "People think a dealer wants the table to lose. I want the table to be worth dealing to. There is a difference, {name}, and it is the only reason I still like this job.",
        choices: [
          choice("wit", "Then I'll try to be an expensive disappointment.", "humorous", "wit", {
            flags: [STORY_FLAG.reina],
            memory: "Reina wants a fair fight more than an easy table.",
            completeScene: true,
          }),
          choice("warm", "I like that you don't pretend the chips are the whole point.", "friendly", "warm", {
            flags: [STORY_FLAG.reina],
            memory: "Reina admitted she stays for the quality of the fight.",
            completeScene: true,
          }),
          choice("ask", "What would a worthy hand look like to you?", "curious", "ask", {
            flags: [STORY_FLAG.reina],
            memory: "You asked Reina what a worthy hand looks like.",
            completeScene: true,
          }),
          choice("flirt", "You're more dangerous when you mean it.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.reina],
            memory: "You flirted with Reina and she refused to be cheap about it.",
            completeScene: true,
          }),
        ],
      },
      {
        id: "wit",
        speaker: "reina",
        text: "Good. Disappoint me expensively. Soft seventeen I stand on, and if I'm showing a six you may let a stiff hand live. That is the only free tip you get while I'm smiling.",
        next: "close",
      },
      {
        id: "warm",
        speaker: "reina",
        text: "The chips are how we keep score. The point is whether you flinch. You don't, tonight. Sit with me again when the room gets late. I am better company when the amateurs have gone.",
        next: "close",
      },
      {
        id: "ask",
        speaker: "reina",
        text: "A player who stands when standing is correct, and jokes when the joke will not cost them the hand. I had that, once, in another city. I did not follow him. I am still deciding if that was discipline.",
        next: "close",
      },
      {
        id: "flirt",
        speaker: "reina",
        text: "Dangerous is a compliment dealers get from people who want a discount. From you I'll allow it — once — if the next thing you do at my table is think.",
        next: "close",
      },
      {
        id: "close",
        speaker: "narration",
        text: "She turns her glass a quarter inch, which for Reina is practically a toast.",
        choices: [
          choice("stay", "I'll earn the next tip.", "friendly", "bye", { completeScene: true }),
        ],
      },
      { id: "bye", speaker: "reina", text: "See that you do.", next: "done" },
      endNode("done", "narration", "The bar noise folds back in. You have the sense she will remember the wording.", "talk"),
    ],
  }),
  scene({
    id: "bar-reina-late",
    title: "After the amateurs",
    characterId: "reina",
    place: "bar",
    once: true,
    requiresFlag: STORY_FLAG.reina,
    time: ["late", "after"],
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "reina",
        text: "There was a room in another city where I dealt until my hands knew the cards better than my name. I left when I started wanting the players to be interesting more than I wanted the shift to end. Ridiculous reason. It brought me here.",
        choices: [
          choice("glad", "I'm glad the ridiculous reason worked.", "friendly", "glad", {
            memory: "Reina came to Midnight Mirage because she wanted interesting players.",
            journal: { title: "Reina's other city", body: "She left a room where she was excellent because excellence had gotten lonely." },
          }),
          choice("joke", "So this is a recovery program for bored prodigies.", "humorous", "joke"),
          choice("ask", "Do you ever want to play, instead of deal?", "curious", "ask"),
        ],
      },
      { id: "glad", speaker: "reina", text: "It worked on the nights someone like you sits down. Don't make me repeat that where Naomi can footnote it.", next: "done" },
      { id: "joke", speaker: "reina", text: "If it is a program, the graduation gift is a quiet room and one hand with no shoe. I have been considering the syllabus.", next: "done" },
      { id: "ask", speaker: "reina", text: "I play in private, where winning doesn't have to be a performance. If I ever invite you, it will not be to take your chips.", next: "done" },
      endNode("done", "narration", "Her smile is small and exact, like a card placed rather than thrown.", "talk"),
    ],
  }),
  scene({
    id: "table-reina",
    title: "Between shoes",
    characterId: "reina",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "reina",
        text: "You play like you're listening. Most people only wait for their turn to speak.",
        choices: [
          choice("listen", "The table says plenty if you don't talk over it.", "friendly", "back", {
            flags: [STORY_FLAG.reina],
            memory: "Reina noticed you listen at the table.",
            completeScene: true,
          }),
          choice("joke", "Don't tell the cards. They'll get arrogant.", "humorous", "back", {
            flags: [STORY_FLAG.reina],
            memory: "You and Reina traded a joke between shoes.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "reina", text: "Arrogant cards I can handle. Arrogant players I send to Mika to cool off.", next: "done" },
      endNode("done", "narration", "She squares the deck. The next hand is allowed to begin.", "talk"),
    ],
  }),
  scene({
    id: "bar-akari",
    title: "Your tell",
    characterId: "akari",
    place: "bar",
    once: true,
    flag: STORY_FLAG.akari,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "akari",
        text: "You want the truth? Your tell isn't a twitch. It's the half-second you become polite before a bluff. Manners. Tragic. Fixable. Attractive, unfortunately.",
        choices: [
          choice("caught", "Then I'll be rude the next time I'm lying.", "humorous", "caught", {
            flags: [STORY_FLAG.akari],
            memory: "Akari caught your polite-before-a-bluff tell.",
            completeScene: true,
          }),
          choice("ask", "What do you do with a tell once you own it?", "curious", "ask", {
            flags: [STORY_FLAG.akari],
            memory: "You asked Akari what she does with other people's tells.",
            completeScene: true,
          }),
          choice("flirt", "You can keep that one. I have others.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.akari],
            memory: "You let Akari keep a tell and promised her more.",
            completeScene: true,
          }),
          choice("warm", "Thank you for telling me instead of just using it.", "friendly", "warm", {
            flags: [STORY_FLAG.akari],
            memory: "Akari gave you a tell instead of only exploiting it.",
            completeScene: true,
          }),
        ],
      },
      { id: "caught", speaker: "akari", text: "Rude looks good on a bluff. Don't practice on Rin. She'll wait three streets and then invoice you.", next: "done" },
      { id: "ask", speaker: "akari", text: "I used to sell them, in a manner of speaking. A man in a white suit paid me to watch his opponents and not to watch him. He was the one lying. I kept the money and left the city. Midnight Mirage doesn't ask me to pick a side.", next: "done" },
      { id: "flirt", speaker: "akari", text: "Greedy. I accept. Bring the next tell in person, not across a crowded pot where I have to behave.", next: "done" },
      { id: "warm", speaker: "akari", text: "Don't spread that around. I have a reputation for being expensive and unhelpful.", next: "done" },
      endNode("done", "narration", "She taps the bar twice, a private little knock, as if the conversation won a small pot.", "talk"),
    ],
  }),
  scene({
    id: "table-akari",
    title: "Reading the raise",
    characterId: "akari",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "akari",
        text: "Hana raises when she has it and when the board scares amateurs. Rin raises like a door closing. You raise like you're hoping I'll comment. I am. Hello.",
        choices: [
          choice("tease", "Comment away. I'll charge you a tell.", "humorous", "back", {
            flags: [STORY_FLAG.akari],
            memory: "You teased Akari about charging her a tell.",
            completeScene: true,
          }),
          choice("flirt", "Maybe I raise because you're watching.", "flirtatious", "back", {
            flags: [STORY_FLAG.akari],
            memory: "You told Akari you raise because she is watching.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "akari", text: "Dangerous admission. I plan to enjoy it responsibly. Which is to say, not at all.", next: "done" },
      endNode("done", "narration", "She stays on her feet beside the table, delighted with the mess she's made.", "talk"),
    ],
  }),
  scene({
    id: "bar-celeste",
    title: "What the spin is for",
    characterId: "celeste",
    place: "bar",
    once: true,
    flag: STORY_FLAG.celeste,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "celeste",
        text: "A guest once put their last chip on seventeen because their mother was born on that day. They lost. A year later they came back only to say the story had been worth the chip. I have been trying to deserve that kind of visit ever since.",
        choices: [
          choice("ask", "Do you believe the wheel is anything but physics?", "curious", "ask", {
            flags: [STORY_FLAG.celeste],
            memory: "Celeste told you about the guest who bet on seventeen.",
            journal: { title: "Seventeen", body: "Celeste keeps a loss that turned into a thank-you. She still doesn't call it fate." },
            completeScene: true,
          }),
          choice("kind", "That guest was lucky to have you narrating it.", "friendly", "kind", {
            flags: [STORY_FLAG.celeste],
            memory: "You told Celeste the guest was lucky to have her as narrator.",
            completeScene: true,
          }),
          choice("joke", "I promise not to bet my biography on a birthday.", "humorous", "joke", {
            flags: [STORY_FLAG.celeste],
            memory: "You promised Celeste you wouldn't bet your biography.",
            completeScene: true,
          }),
          choice("flirt", "I'd come back for the hostess, not the number.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.celeste],
            memory: "You told Celeste you would come back for her, not the number.",
            completeScene: true,
          }),
        ],
      },
      { id: "ask", speaker: "celeste", text: "Physics turns the ball. People turn the meaning. I believe in the second one more, which is inconvenient for a woman in sequins standing next to a machine.", next: "done" },
      { id: "kind", speaker: "celeste", text: "Careful. If you flatter the narrator, she may start offering private epilogues.", next: "done" },
      { id: "joke", speaker: "celeste", text: "A wise policy. Birthdays are fragile. Moonlight is sturdier. I prefer my ceremonies after eleven.", next: "done" },
      { id: "flirt", speaker: "celeste", text: "Then don't applaud the wheel when it behaves. Applaud nothing. Just stay. I notice that more.", next: "done" },
      endNode("done", "narration", "The crescent in her hair catches the bar light and, unhelpfully, looks intentional.", "talk"),
    ],
  }),
  scene({
    id: "table-celeste",
    title: "Before the ball drops",
    characterId: "celeste",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "celeste",
        text: "Place it like you mean the number, or like you mean the moment. I can tell the difference. Only one of those makes a good story if you lose.",
        choices: [
          choice("moment", "Then I'll bet the moment, and let the number be rude if it wants.", "curious", "back", {
            flags: [STORY_FLAG.celeste],
            memory: "You told Celeste you were betting the moment.",
            completeScene: true,
          }),
          choice("flirt", "If I lose, I'd like the story to include you.", "flirtatious", "back", {
            flags: [STORY_FLAG.celeste],
            memory: "You asked Celeste to be part of the story even if the spin lost.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "celeste", text: "Granted. Spin when you're ready. I will not hurry a ritual.", next: "done" },
      endNode("done", "narration", "Her hand rests on the rail, patient as the wheel.", "talk"),
    ],
  }),
  scene({
    id: "bar-mika",
    title: "Symbols in the margin",
    characterId: "mika",
    place: "bar",
    once: true,
    flag: STORY_FLAG.mika,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "mika",
        text: "I sketch symbols on break. Not sevens — everyone does sevens. Mine are little lanterns and a fox who pays you for being brave in a tiny way. The floor manager says cabinets need to be legible. I say people need to be celebrated. We're in talks.",
        choices: [
          choice("encourage", "Design it. I'll be first in line to lose to a fox.", "friendly", "yes", {
            flags: [STORY_FLAG.mika],
            memory: "Mika wants to design a slot machine that celebrates small bravery.",
            journal: { title: "Mika's fox", body: "She sketches a lantern-and-fox cabinet the floor keeps calling illegible. She keeps sketching." },
            completeScene: true,
          }),
          choice("joke", "If the fox judges my courage, I want a practice mode.", "humorous", "joke", {
            flags: [STORY_FLAG.mika],
            memory: "You joked with Mika about a fox that judges courage.",
            completeScene: true,
          }),
          choice("ask", "Why slots, of all the tables?", "curious", "ask", {
            flags: [STORY_FLAG.mika],
            memory: "You asked Mika why she chose the slots.",
            completeScene: true,
          }),
          choice("flirt", "I'd celebrate a win more if you were the one who designed it.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.mika],
            memory: "You flirted with Mika about celebrating her designs.",
            completeScene: true,
          }),
        ],
      },
      { id: "yes", speaker: "mika", text: "Don't say that so sincerely, I'll actually finish it. I crash before the high rollers do. If I ever invite you up, it'll be early, and there will be sketches, not a jackpot.", next: "done" },
      { id: "joke", speaker: "mika", text: "Practice mode is my love language. That and cocoa. Iris pretends the cocoa is off menu. It isn't.", next: "done" },
      { id: "ask", speaker: "mika", text: "Because the first guest who ever thanked me was scared of a button. I showed her the middle line. She won three credits and cried like it was rent. I want more of that, on purpose.", next: "done" },
      { id: "flirt", speaker: "mika", text: "Oh. Okay. I'm putting that in the sketchbook margin where the manager can't see it. It's a compliment margin now.", next: "done" },
      endNode("done", "narration", "She bounces once on the stool and then remembers she is in a very expensive room.", "talk"),
    ],
  }),
  scene({
    id: "table-mika",
    title: "The friendly line",
    characterId: "mika",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "mika",
        text: "New here or just new to asking questions? Either way: three across pays, wilds fill in, and you are allowed to clap for cherries. I insist, actually.",
        choices: [
          choice("thanks", "Thanks for making the first spin feel allowed.", "friendly", "back", {
            flags: [STORY_FLAG.mika],
            memory: "Mika made the first spin feel allowed.",
            completeScene: true,
          }),
          choice("joke", "I will clap for cherries with my whole professional dignity.", "humorous", "back", {
            flags: [STORY_FLAG.mika],
            memory: "You promised Mika a dignified clap for cherries.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "mika", text: "Dignity is welcome. Volume is welcomer. Spin when you want.", next: "done" },
      endNode("done", "narration", "The cabinet lights blink like they're in on it.", "talk"),
    ],
  }),
  scene({
    id: "bar-shiori",
    title: "Shared quiet",
    characterId: "shiori",
    place: "bar",
    once: true,
    flag: STORY_FLAG.shiori,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "shiori",
        text: "You sat without filling the air. Most people treat silence as a bill they refuse to pay. I deal baccarat because the rules know when a hand is finished. I am still learning that about conversations.",
        choices: [
          choice("quiet", "We don't have to fill it. I'll sit.", "friendly", "quiet", {
            flags: [STORY_FLAG.shiori],
            memory: "You sat with Shiori and let the silence stay.",
            journal: { title: "Shiori's minute", body: "She does not perform warmth. She offered a quiet minute, and you didn't spend it." },
            completeScene: true,
          }),
          choice("ask", "Who taught you to love a strict rule?", "curious", "ask", {
            flags: [STORY_FLAG.shiori],
            memory: "You asked Shiori who taught her to love strict rules.",
            completeScene: true,
          }),
          choice("soft", "A finished hand sounds like a mercy.", "humorous", "soft", {
            flags: [STORY_FLAG.shiori],
            memory: "Shiori almost smiled when you called a finished hand a mercy.",
            completeScene: true,
          }),
          choice("flirt", "You're beautiful when you're impossible to read.", "flirtatious", "flirt", {
            flags: ["shiori_rushed"],
            memory: "You flirted with Shiori before she had offered any closeness.",
            completeScene: true,
          }),
        ],
      },
      { id: "quiet", speaker: "shiori", text: "Then stay for the length of this song and no performance. If I ever ask you upstairs, it will be for tea and a true thing. Not for a reward.", next: "done" },
      { id: "ask", speaker: "shiori", text: "A teacher who thought quiet girls were unfinished. I became exact out of spite, then discovered I liked exactness more than the spite. The spite I have been trying to set down.", next: "done" },
      { id: "soft", speaker: "shiori", text: "A mercy. Yes. I had not called it that. …Thank you.", next: "done" },
      { id: "flirt", speaker: "shiori", text: "Please don't aim that at me yet. I am not a hand to be won. If you still want to talk later, ask me something that is not about my face.", next: "done" },
      endNode("done", "narration", "She returns her hands to her lap, composed, but she does not leave.", "talk"),
    ],
  }),
  scene({
    id: "bar-shiori-family",
    title: "A choice to be quiet",
    characterId: "shiori",
    place: "bar",
    once: true,
    requiresFlag: STORY_FLAG.shiori,
    time: ["late", "after"],
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "shiori",
        text: "My family liked the version of me that did not take up a table. This job is the first room where my quiet is a skill they cannot claim. I would like, sometimes, for it also to be a choice I make beside someone.",
        choices: [
          choice("honor", "Then I'll treat it as a choice, not a puzzle to crack.", "friendly", "back", {
            memory: "Shiori wants her quiet to be a choice, not an absence.",
            journal: { title: "Beside Shiori", body: "She said the quiet is a skill. She also said she would like it to be a choice made beside someone." },
          }),
          choice("ask", "What does that someone have to do, besides not rush you?", "curious", "back"),
        ],
      },
      { id: "back", speaker: "shiori", text: "Very little. Stay when I am exact. Leave kindly if I ask. Do not bring the table's applause upstairs.", next: "done" },
      endNode("done", "narration", "The jade earring turns when she nods, the smallest yes.", "talk"),
    ],
  }),
  scene({
    id: "table-shiori",
    title: "Why the third card",
    characterId: "shiori",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "shiori",
        text: "If you want the rule: a player total of five or less draws. The banker answers to that card, not to hope. I will explain every draw if you ask. I like being asked more than being guessed.",
        choices: [
          choice("ask", "I'll ask, then. Guessing feels rude at your table.", "curious", "back", {
            flags: [STORY_FLAG.shiori],
            memory: "Shiori said she would rather be asked than guessed.",
            completeScene: true,
          }),
          choice("sit", "Then I'll watch one hand without narrating it.", "friendly", "back", {
            flags: [STORY_FLAG.shiori],
            memory: "You offered Shiori a hand without narration.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "shiori", text: "Good. Place a bet when you wish. Or don't. The shoe will survive either decision.", next: "done" },
      endNode("done", "narration", "She smooths an invisible wrinkle from the layout.", "talk"),
    ],
  }),
  scene({
    id: "bar-iris",
    title: "Not an audience",
    characterId: "iris",
    place: "bar",
    once: true,
    flag: STORY_FLAG.iris,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "iris",
        text: "I used to sing after midnight in a room that clapped on the beat and nowhere else. I was good. I was also tired of being furniture that hits a high note. So I pour, and I remember drinks, and I do not repeat what people confess. You're looking at me like you want the rest.",
        choices: [
          choice("ask", "Would you ever sing for one person, not a room?", "curious", "ask", {
            flags: [STORY_FLAG.iris],
            memory: "Iris stopped singing for crowds. You asked if she would sing for one person.",
            journal: { title: "Iris used to sing", body: "She left the stage because applause had started to feel like a job description." },
            completeScene: true,
          }),
          choice("warm", "I don't need the rest. I'm glad you have a bar that is yours.", "friendly", "warm", {
            flags: [STORY_FLAG.iris],
            memory: "You told Iris you were glad the bar was hers.",
            completeScene: true,
          }),
          choice("joke", "I'll confess only my drink order. It's a short confession.", "humorous", "joke", {
            flags: [STORY_FLAG.iris],
            memory: "You promised Iris your only confession would be a drink order.",
            completeScene: true,
          }),
          choice("flirt", "I'd rather be the one listener than the room.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.iris],
            memory: "You told Iris you wanted to be one listener, not a crowd.",
            completeScene: true,
          }),
        ],
      },
      { id: "ask", speaker: "iris", text: "Maybe. After the stools are up and nobody is performing thirst. Don't applaud if it happens. Just hear it. That's the whole audition.", next: "done" },
      { id: "warm", speaker: "iris", text: "It is mine between one and the hour the cleaners arrive. If you're still in the building then, you'll understand the difference.", next: "done" },
      { id: "joke", speaker: "iris", text: "A short confession is my favorite genre. The Moonlight Fizz is zero-proof and still counts as a personality.", next: "done" },
      { id: "flirt", speaker: "iris", text: "Then don't clap, and don't rush the chorus. I like you more already, which I will deny if Akari asks.", next: "done" },
      endNode("done", "narration", "She polishes a glass that was already clean, buying the moment an extra second.", "talk"),
    ],
  }),
  scene({
    id: "bar-naomi",
    title: "The notebook",
    characterId: "naomi",
    place: "bar",
    once: true,
    flag: STORY_FLAG.naomi,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "naomi",
        text: "I write decisions. Hit, stand, the upcard, whether I was performing bravery. People think it's cold. It is how I stop the night from lying to me about who I am.",
        choices: [
          choice("ask", "What do you write when the decision was right and the card was cruel?", "curious", "ask", {
            flags: [STORY_FLAG.naomi],
            memory: "Naomi writes decisions so the night can't lie to her.",
            journal: { title: "Naomi's margin", body: "She records the choice, not the outcome. Cruel cards get a smaller note than cowardly ones." },
            completeScene: true,
          }),
          choice("warm", "It doesn't sound cold. It sounds like you want to be fair to yourself.", "friendly", "warm", {
            flags: [STORY_FLAG.naomi],
            memory: "You told Naomi her notebook sounded like fairness, not coldness.",
            completeScene: true,
          }),
          choice("joke", "Should I be worried I'm about to become a footnote?", "humorous", "joke", {
            flags: [STORY_FLAG.naomi],
            memory: "Naomi considered making you a footnote and did not seem opposed.",
            completeScene: true,
          }),
          choice("flirt", "You can study me. I'll try to be a flattering data set.", "flirtatious", "flirt", {
            memory: "You flirted with Naomi and she asked for a better question.",
            completeScene: true,
          }),
        ],
      },
      { id: "ask", speaker: "naomi", text: "I write 'correct' and then, if I am feeling indulgent, a very small star. You played a sixteen against a six properly last time. It got a star. Don't be strange about it.", next: "done" },
      { id: "warm", speaker: "naomi", text: "Fairness is the only romance I trusted for a long time. I'm not opposed to a second kind. I am opposed to being rushed toward it.", next: "done" },
      { id: "joke", speaker: "naomi", text: "You already are one. Page twelve. 'Guest laughs before the outcome. Promising, irritating.'", next: "done" },
      { id: "flirt", speaker: "naomi", text: "I don't study people for sport. Ask me something you actually want to know, later, when you haven't just tried to be charming.", next: "done" },
      endNode("done", "narration", "She closes the notebook with a precision that feels, oddly, like trust.", "talk"),
    ],
  }),
  scene({
    id: "table-naomi",
    title: "A star in the margin",
    characterId: "naomi",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "naomi",
        text: "You stood when standing was dull and correct. Dull is underrated. I wrote it down.",
        choices: [
          choice("ask", "Do the dull decisions ever get the star?", "curious", "back", {
            flags: [STORY_FLAG.naomi],
            memory: "Naomi gives stars to dull, correct decisions.",
            completeScene: true,
          }),
          choice("warm", "I'll take dull and correct. It's a good reputation.", "friendly", "back", {
            flags: [STORY_FLAG.naomi],
            memory: "You accepted Naomi's compliment of being dull and correct.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "naomi", text: "They get the star precisely because nobody claps. Don't change now that I've said it.", next: "done" },
      endNode("done", "narration", "She underlines something you will never be allowed to read. It does not feel unkind.", "talk"),
    ],
  }),
  scene({
    id: "bar-yuki",
    title: "The honest bust",
    characterId: "yuki",
    place: "bar",
    once: true,
    flag: STORY_FLAG.yuki,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "yuki",
        text: "I busted a sixteen against a five last week and laughed so hard Reina threatened to like me. Risk isn't holy. It's just the only time I can hear myself think. The rest of the day I'm very good at being fine.",
        choices: [
          choice("joke", "Being fine is the real high-stakes game.", "humorous", "joke", {
            flags: [STORY_FLAG.yuki],
            memory: "Yuki busts when she wants to hear herself think.",
            completeScene: true,
          }),
          choice("flirt", "Laugh like that again and I'll forget whose chips they were.", "flirtatious", "flirt", {
            flags: [STORY_FLAG.yuki],
            memory: "You flirted with Yuki about the way she laughs at a bust.",
            completeScene: true,
          }),
          choice("warm", "You can be fine here without making it a stunt.", "friendly", "warm", {
            flags: [STORY_FLAG.yuki],
            memory: "You told Yuki she could be fine without making it a stunt.",
            completeScene: true,
          }),
          choice("ask", "What would a brave hand look like if it wasn't a bust?", "curious", "ask", {
            flags: [STORY_FLAG.yuki],
            memory: "You asked Yuki what bravery looks like besides a bust.",
            completeScene: true,
          }),
        ],
      },
      { id: "joke", speaker: "yuki", text: "Exactly. So if I invite you up, it won't be because you won. It'll be because you were interesting while the chips misbehaved.", next: "done" },
      { id: "flirt", speaker: "yuki", text: "Keep talking like that and I'll start winning out of spite, just to stay at the table. Dangerous power. Use it late, when Naomi isn't scoring us.", next: "done" },
      { id: "warm", speaker: "yuki", text: "That's the nicest dare I've had all week. I'm bad at soft. I'll try it like I try a double: committed, slightly too loud.", next: "done" },
      { id: "ask", speaker: "yuki", text: "Telling the truth in a quiet room. No audience. That's the scary bet. Cards are easy compared to that.", next: "done" },
      endNode("done", "narration", "She knocks her glass against yours without asking, and somehow it isn't rude.", "talk"),
    ],
  }),
  scene({
    id: "table-yuki",
    title: "Your nerve",
    characterId: "yuki",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "yuki",
        text: "Don't copy me unless you mean it. I hit too much. It's a personality, not a strategy. Reina has a pamphlet. I have a grin.",
        choices: [
          choice("joke", "I'll keep my personality and your grin in separate piles.", "humorous", "back", {
            flags: [STORY_FLAG.yuki],
            memory: "Yuki warned you her hitting is a personality, not a strategy.",
            completeScene: true,
          }),
          choice("flirt", "The grin is doing more work than the pamphlet.", "flirtatious", "back", {
            flags: [STORY_FLAG.yuki],
            memory: "You told Yuki her grin outworks the strategy pamphlet.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "yuki", text: "Correct. Don't tell the pamphlet. It's sensitive.", next: "done" },
      endNode("done", "narration", "She leans back like the chair owes her interest.", "talk"),
    ],
  }),
  scene({
    id: "bar-hana",
    title: "Off the record",
    characterId: "hana",
    place: "bar",
    once: true,
    flag: STORY_FLAG.hana,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "hana",
        text: "I'm writing a novel about a casino, which is a polite way to say I come here to watch people choose and then fail to go home. I once bluffed a friend because I wanted to see if I could. I could. I have not enjoyed a pot since, not really. Why did you come tonight?",
        choices: [
          choice("honest", "For the rooms, the noise, and the chance someone would be worth talking to.", "friendly", "honest", {
            flags: [STORY_FLAG.hana],
            memory: "Hana is writing a novel she keeps failing to treat as research.",
            journal: { title: "Hana's bluff", body: "She bluffed a friend just to see if she could. The pot has felt counterfeit ever since." },
            completeScene: true,
          }),
          choice("ask", "Did you ever tell the friend?", "curious", "ask", {
            flags: [STORY_FLAG.hana],
            memory: "You asked Hana whether she told the friend she bluffed.",
            completeScene: true,
          }),
          choice("joke", "I came to be misquoted in chapter four.", "humorous", "joke", {
            flags: [STORY_FLAG.hana],
            memory: "You volunteered to be misquoted in Hana's novel.",
            completeScene: true,
          }),
          choice("flirt", "Maybe I came hoping you'd close the notebook.", "flirtatious", "flirt", {
            memory: "You flirted with Hana before she had finished the story.",
            completeScene: true,
          }),
        ],
      },
      { id: "honest", speaker: "hana", text: "Worth talking to. I'll take the assignment. If the chapter gets good, I won't put you in it. Some things I want off the record on purpose.", next: "done" },
      { id: "ask", speaker: "hana", text: "Yes. She laughed and said she'd known. I have never been so relieved to be a worse liar than I thought. The flower brooch was hers. I wear it so I don't try that trick again.", next: "done" },
      { id: "joke", speaker: "hana", text: "Chapter four is already crowded with men who raise preflop and call it character. You'd be a relief.", next: "done" },
      { id: "flirt", speaker: "hana", text: "I might. Not because you aimed at it. Ask me about the book again when you want the answer more than the pose.", next: "done" },
      endNode("done", "narration", "She touches the flower brooch once, then lets her hand fall, decision made to stay.", "talk"),
    ],
  }),
  scene({
    id: "table-hana",
    title: "The pause",
    characterId: "hana",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "hana",
        text: "You pause before you bluff. It's a kindness. It's also a tell. I'm telling you because I like you more than the pot.",
        choices: [
          choice("thanks", "Then I'll try to be kind on purpose and quick by accident.", "friendly", "back", {
            flags: [STORY_FLAG.hana],
            memory: "Hana warned you that kindness before a bluff is a tell.",
            completeScene: true,
          }),
          choice("ask", "Do you pause before the things you mean?", "curious", "back", {
            flags: [STORY_FLAG.hana],
            memory: "You asked Hana if she pauses before the things she means.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "hana", text: "Only when they matter. Consider that a preview, not a promise.", next: "done" },
      endNode("done", "narration", "Akari, across the table, looks delighted to have witnessed a sincere sentence.", "talk"),
    ],
  }),
  scene({
    id: "bar-rin",
    title: "The record",
    characterId: "rin",
    place: "bar",
    once: true,
    flag: STORY_FLAG.rin,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "rin",
        text: "My aunt taught me poker. Nobody taught me music. I just… stay where it is. You don't have to talk. If you do, make it a real question.",
        choices: [
          choice("ask", "What are you listening for, when you get quiet?", "curious", "ask", {
            flags: [STORY_FLAG.rin],
            memory: "Rin learned poker from her aunt and music from no one.",
            journal: { title: "Rin's aunt", body: "Poker was inherited. Music she found by staying near it. She will share either if you don't crowd her." },
            completeScene: true,
          }),
          choice("sit", "Then I'll just sit with the quiet.", "friendly", "sit", {
            flags: [STORY_FLAG.rin],
            memory: "You sat with Rin and didn't fill her quiet.",
            completeScene: true,
          }),
          choice("joke", "A real question: is the turtleneck part of the strategy?", "humorous", "joke", {
            flags: [STORY_FLAG.rin],
            memory: "Rin almost smiled at a joke about her turtleneck.",
            completeScene: true,
          }),
          choice("flirt", "You're stunning when you refuse to perform.", "flirtatious", "flirt", {
            memory: "You flirted with Rin and she asked you to wait.",
            completeScene: true,
          }),
        ],
      },
      { id: "ask", speaker: "rin", text: "The note that doesn't rush the next one. People, too. After hours, the bar plays something slow. I stay for that. You could. If you can be quiet on purpose.", next: "done" },
      { id: "sit", speaker: "rin", text: "Good. This is the part most people ruin.", next: "done" },
      { id: "joke", speaker: "rin", text: "Yes. Intimidation. Also wool. …That was a joke. Mine.", next: "done" },
      { id: "flirt", speaker: "rin", text: "Don't. Not as an opening. Ask about the music or sit still. Those work.", next: "done" },
      endNode("done", "narration", "She returns her attention to the piano, and the attention does not feel like a dismissal.", "talk"),
    ],
  }),
  scene({
    id: "table-rin",
    title: "One sentence",
    characterId: "rin",
    place: "table",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "rin",
        text: "You didn't chatter during the river. I noticed.",
        choices: [
          choice("ask", "What do you hear in a quiet hand?", "curious", "back", {
            flags: [STORY_FLAG.rin],
            memory: "Rin noticed you didn't chatter during the river.",
            completeScene: true,
          }),
          choice("sit", "I'll keep not chattering.", "friendly", "back", {
            flags: [STORY_FLAG.rin],
            memory: "You promised Rin you would keep the river quiet.",
            completeScene: true,
          }),
        ],
      },
      { id: "back", speaker: "rin", text: "The size of the bet, and whether anyone is scared of it. That's enough.", next: "done" },
      endNode("done", "narration", "She checks, as if the conversation were also a street she intends to see through.", "talk"),
    ],
  }),
  scene({
    id: "lobby-aoi",
    title: "The threshold",
    characterId: "aoi",
    place: "lobby",
    once: true,
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "aoi",
        text: "People ask me who is lucky tonight. I tell them the vents are balanced and the suite lamps are warm. Luck is above my pay grade. Care isn't. How is the floor treating you, {name}?",
        choices: [
          choice("well", "Better for having someone at the door who means it.", "friendly", "well", {
            flags: ["aoi_house"],
            memory: "Aoi takes care of the house without pretending to sell luck.",
            journal: { title: "Aoi at the door", body: "She will refresh a rack, hold a note, and walk you to your suite. She will not be collected." },
            completeScene: true,
          }),
          choice("ask", "What do you want from a night here, when it isn't a shift?", "curious", "ask", {
            flags: ["aoi_house"],
            memory: "You asked Aoi what she wants from a night off.",
            completeScene: true,
          }),
          choice("joke", "The lamps are warm. That's already a better payout than zero.", "humorous", "joke", {
            flags: ["aoi_house"],
            memory: "Aoi laughed about warm lamps beating a roulette zero.",
            completeScene: true,
          }),
          choice("flirt", "You could take a night off and let me walk you somewhere.", "flirtatious", "flirt", {
            memory: "Aoi declined a flirtation and stayed kind.",
            completeScene: true,
          }),
        ],
      },
      { id: "well", speaker: "aoi", text: "Then I am doing the job I wanted when I took the jacket. If a note arrives, I will keep it unopened. If you need a door, I will find the right one. Not mine.", next: "done" },
      { id: "ask", speaker: "aoi", text: "A bath, a novel with a foolish detective, and the knowledge that everyone downstairs got home. You are part of that last hope. Don't make it complicated.", next: "done" },
      { id: "joke", speaker: "aoi", text: "I should put that on the stationery. Management would have questions. I would win them.", next: "done" },
      { id: "flirt", speaker: "aoi", text: "I keep the doors. I don't walk through them with guests. I am glad you feel easy here — that part you can have for free.", next: "done" },
      endNode("done", "narration", "She straightens a pen that was already straight, pleased anyway.", "talk"),
    ],
  }),
  scene({
    id: "group-bluff",
    title: "The bluff debate",
    characterId: "iris",
    place: "group",
    affects: ["iris", "akari", "hana", "rin"],
    once: true,
    time: ["prime", "late"],
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: "akari",
        text: "I'm saying a bluff is a gift. You give the table a story. Hana thinks it's a moral injury. Rin thinks we're both loud.",
      },
      {
        id: "hana",
        speaker: "hana",
        text: "I think lying to a friend for sport is how you end up wearing her brooch out of guilt. Strangers at a table consented to theater. There's a difference, Akari.",
      },
      {
        id: "rin",
        speaker: "rin",
        text: "Both loud.",
      },
      {
        id: "iris",
        speaker: "iris",
        text: "{name} walks into a live argument and a full bar. Congratulations. You get a vote, if you want one. No one has to win.",
        choices: [
          choice("theater", "At the table it's theater. Outside it, tell the truth.", "friendly", "end-kind", {
            flags: ["group_bluff"],
            markGroup: true,
            memory: "You told the bar that bluffs belong at the table, not with friends.",
            others: [
              { id: "hana", affinity: 2 },
              { id: "akari", affinity: 1 },
            ],
            journal: { title: "The bluff debate", body: "Akari called a bluff a gift. Hana called one of hers a regret. You sided with theater at the table and honesty outside it." },
            completeScene: true,
          }),
          choice("gift", "A good bluff is a gift. Bad ones are just invoices.", "humorous", "end-akari", {
            flags: ["group_bluff"],
            markGroup: true,
            memory: "You called a good bluff a gift and a bad one an invoice.",
            others: [{ id: "akari", affinity: 2 }],
            completeScene: true,
          }),
          choice("ask", "Rin, you actually have to pick a side. Sorry.", "curious", "end-rin", {
            flags: ["group_bluff"],
            markGroup: true,
            memory: "You asked Rin to take a side in the bluff debate.",
            others: [{ id: "rin", affinity: 2 }],
            completeScene: true,
          }),
        ],
      },
      { id: "end-kind", speaker: "hana", text: "That's the line I wanted someone else to draw. Akari, you may keep your theater. Leave my friends out of the cast.", next: "last" },
      { id: "end-akari", speaker: "akari", text: "Invoices! I'm stealing that. Hana, your brooch is safe. I'm a professional menace, not a monster.", next: "last" },
      { id: "end-rin", speaker: "rin", text: "Bluff strangers. Don't bluff people you want to keep. That's the side.", next: "last" },
      {
        id: "last",
        speaker: "iris",
        text: "Voted, witnessed, and nobody threw a glass. I love this job. Sit, if you're staying. The argument is off the clock.",
        choices: [choice("done", "I'll stay for a drink.", "friendly", "fade", { completeScene: true })],
      },
      endNode("fade", "narration", "The debate loosens into ordinary laughter. You are in it now, not beside it.", "talk"),
    ],
  }),
];

function inviteScene(id: Exclude<CharacterId, "aoi">, text: string, decline: string): Scene {
  return scene({
    id: `invite-${id}`,
    title: "A note",
    characterId: id,
    place: "invite",
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: id,
        text,
        choices: [
          choice("yes", "I'd like that.", "friendly", "accept", { acceptInvite: true }),
          choice("flirt", "I've been hoping you'd ask for a quieter room.", "flirtatious", "accept", {
            acceptInvite: true,
          }),
          choice("no", "Not tonight. Thank you for asking.", "friendly", "no", { declineInvite: true }),
        ],
      },
      {
        id: "accept",
        speaker: "narration",
        text: "The note might as well be a key. You can still leave whenever you want.",
      },
      { id: "no", speaker: id, text: decline, next: "gone" },
      endNode("gone", "narration", "Nothing in the room changes temperature. That is its own kind of grace.", "leave"),
    ],
  });
}

function hotelScene(
  id: Exclude<CharacterId, "aoi">,
  opening: string,
  curious: string,
  friendly: string,
  playful: string,
  flirt: string,
  closer: string,
  romantic: string,
  talk: string,
): Scene {
  return scene({
    id: `hotel-${id}`,
    title: "Upstairs",
    characterId: id,
    place: "hotel",
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: id,
        text: opening,
        choices: [
          choice("ask", "Tell me the part you don't tell the floor.", "curious", "ask"),
          choice("warm", "I'm glad it's just us. No audience.", "friendly", "warm"),
          choice("joke", "I left my best bluff downstairs. Mostly.", "humorous", "joke"),
          choice("flirt", "You look like the evening finally exhaled.", "flirtatious", "flirt"),
        ],
      },
      { id: "ask", speaker: id, text: curious, next: "fork" },
      { id: "warm", speaker: id, text: friendly, next: "fork" },
      { id: "joke", speaker: id, text: playful, next: "fork" },
      { id: "flirt", speaker: id, text: flirt, next: "fork" },
      {
        id: "fork",
        speaker: "narration",
        text: "The city is a jewelry box outside the glass. Nobody is owed the next inch.",
        choices: [
          choice("close", "May I come closer?", "flirtatious", "near"),
          choice("talk", "Let's keep talking. This is already enough.", "friendly", "stay"),
          choice("night", "I should let you have the rest of the night.", "friendly", "bye", { end: "leave" }),
        ],
      },
      { id: "near", speaker: id, text: closer, next: "kiss" },
      {
        id: "kiss",
        speaker: "narration",
        text: romantic,
        choices: [
          choice("fade", "Stay in this, just for a minute.", "flirtatious", "after", {
            end: "romantic",
            memory: `You and ${CHARACTERS[id].name} shared a private, unhurried moment upstairs.`,
            journal: {
              title: `Upstairs with ${CHARACTERS[id].name}`,
              body: `The room stayed kind. Nothing was owed, and the closeness was chosen.`,
            },
          }),
        ],
      },
      { id: "after", speaker: id, text: "The minute can be longer. The door still locks from your side.", next: "done-r" },
      endNode("done-r", "narration", "Neon softens on the glass. Whatever happens next stays off the floor.", "romantic"),
      { id: "stay", speaker: id, text: talk, next: "done-t" },
      endNode("done-t", "narration", "You talk until the city looks less like a performance. Leaving is easy, which makes staying feel honest.", "talk"),
      { id: "bye", speaker: id, text: "Then go well. Tonight was not a loss.", next: "done-l" },
      endNode("done-l", "narration", "The corridor is quiet. You took nothing you weren't given.", "leave"),
    ],
  });
}

function encoreScene(id: Exclude<CharacterId, "aoi">, line: string): Scene {
  return scene({
    id: `encore-${id}`,
    title: "The door again",
    characterId: id,
    place: "encore",
    entry: "start",
    nodes: [
      {
        id: "start",
        speaker: id,
        text: line,
        choices: [
          choice("stay", "I'll stay a little.", "friendly", "stay", {
            end: "talk",
            memory: `You spent another quiet stretch with ${CHARACTERS[id].name}.`,
          }),
          choice("close", "Come here.", "flirtatious", "close", { end: "romantic" }),
          choice("night", "Just wanted to say goodnight properly.", "friendly", "night", { end: "leave" }),
        ],
      },
      { id: "stay", speaker: "narration", text: "The room remembers you. That is the whole luxury.", next: "end" },
      { id: "close", speaker: "narration", text: "A kiss, brief as a winning card turned over, and then laughter at nothing that needs a plot.", next: "end" },
      { id: "night", speaker: id, text: "Goodnight, then. Properly received.", next: "end" },
      endNode("end", "narration", "You can leave whenever the night has done enough.", "talk"),
    ],
  });
}

const HOTELS: Record<Exclude<CharacterId, "aoi">, Scene> = {
  reina: hotelScene(
    "reina",
    "No shoe. No Naomi taking notes. I dealt us two cards each and then I decided I didn't want a game. I wanted the person who plays like they're listening. Sit. The stake is zero.",
    "I miss being surprised by someone who is not trying to be a story about beating the dealer. You came upstairs without a speech. That surprised me. Don't ruin it with a speech now.",
    "Good. Audiences make me precise. Privacy makes me honest. I am off duty, which means if I smile too long it is not customer service.",
    "Your best bluff is downstairs, and yet you still look like you're hiding a joke. Share it or I'm dealing the two cards out of spite.",
    "The evening exhaled because you stopped trying to win me between hands. Come here only if you would also stay if I kept the conversation instead.",
    "Closer is allowed. I don't do swoons. I do mean it.",
    "She kisses you the way she turns a card she has already decided to play: no flourish, no take-back. The city flickers. She laughs once, quietly, against your mouth, and the laugh is the part she doesn't show the floor.",
    "Then talk. Tell me a hand you are proud of for the decision, not the payout. I'll match you with the night I almost stayed in the other city.",
  ),
  akari: hotelScene(
    "akari",
    "Before you get comfortable: I invited you up to see if you'd call it. 'Akari wants company' is the truth. 'Akari is running a bit' is the bluff. You may pick which one you believe. Both pay.",
    "The truth is I got tired of being the cleverest person who goes home alone. Not lonely in the tragic way. Lonely in the boring way. You are not boring. It's a problem I'm encouraging.",
    "No audience. Then I don't have to be interesting at full volume. Terrifying. Stay anyway.",
    "You left the bluff downstairs and brought the tells. Generous. I'll trade you one: I tug my earring when I'm actually pleased. I am doing it now. Rude of my hand.",
    "Flattery noted, filed, and believed a little. Don't look so victorious. Victory makes me contrary.",
    "Come closer, and if you're bluffing about wanting to, I will know, and I will laugh, and I will still pour you water like a gentleman.",
    "She kisses you like a raise and then waits, grinning, to see if you'll call. You do. It stays a kiss — warm, unhurried, a little smug — and then she bumps her forehead to yours as if the pot were shared.",
    "Good. Then I'll tell you about the man in the white suit without performing the ending. I left. That's the ending. You're a better encore.",
  ),
  celeste: hotelScene(
    "celeste",
    "I promised myself I would not say the moon arranged this. The moon is busy. I asked you because the way you lose is as graceful as the way you win, and I wanted that quality in a room with a lamp.",
    "The part I don't tell the floor: I am sometimes tired of being a ceremony. I still love the wheel. I would like a night that doesn't need a narrator. You can help by being specific. What did you eat today? Start there. Romance survives details.",
    "No audience. Then I can sit like a person and not like a constellation. The hairpin can come out. There. Now I'm only thirty-one and pleased.",
    "Your bluff is adorable and unnecessary. I already invited you. The hard part is over, which means the silly part may begin.",
    "I exhaled because you looked at me when the number missed, not only when it hit. That is a rare courtesy. I am vain enough to want it repeated.",
    "You may. If I turn my face, it is to meet you, not to pose.",
    "The kiss is brief and certain, more choice than fate. Her hand finds yours afterward and stays, which she seems to consider the braver gesture. 'Not the wheel,' she says. 'Us.'",
    "Then let me tell you a useless, true thing: I hum the same four notes whenever the ball lands on zero, so the losers have a soundtrack that isn't pity. No one has noticed. You would have.",
  ),
  mika: hotelScene(
    "mika",
    "Okay, so, full disclosure, I cleaned for twenty minutes and then messed it up so it wouldn't look like I cleaned. There are sketches on the table. Cocoa on the tray. I am nervous in a way that pays no credits. Hi.",
    "The part for you: I want to make games for people who think they're bad at fun. I don't need to be famous. I need one cabinet somewhere with a fox on it and a guest who doesn't apologize for clapping. You clapped. I think about that more than is professional.",
    "Just us is perfect. If I get too loud you can tell me. I won't break. I'll just do an indoor voice like a grown woman who pays taxes.",
    "Your bluff is terrible and I like you. That's the whole note. Sit before I start narrating the cocoa.",
    "I exhaled so hard I fogged the window. You're not allowed to be smooth without warning. Come see the lantern sketch. Then you can be smooth again.",
    "Closer is good. I'm going to smile into it. Fair warning.",
    "She kisses you like she's delighted it was allowed, a soft press, a laugh tucked right against it, nothing hurried and nothing performed. Then she hides her face in her sleeve for one second and comes back braver.",
    "Then I'll show you the bad sketches too. The fox looked like a shoe for a week. You can laugh. I already did. This is my favorite kind of winning.",
  ),
  shiori: hotelScene(
    "shiori",
    "Tea is poured. You may sit at that end of the sofa, or nearer, if nearer is what you want and not what you think I am owed. I asked you here because the quiet with you has started to feel like company.",
    "My family called me a closed door and meant it as praise. I am proud of the door. I am also allowed to open it an inch for someone who does not shove. You haven't shoved. That is the part the floor does not get.",
    "No audience. Then I don't have to make my face a layout. If I look at my hands, I am not leaving. I am choosing words.",
    "A joke in this room is safe. I may even keep it. Don't expect me to top it. I invited you, which was already my bold hand.",
    "I exhaled. Yes. You saw it. I am not sorry. Come nearer only if you can also bear an evening that stays at tea.",
    "You may come closer. Slowly is not hesitation. Slowly is how I mean things.",
    "She asks, very simply, if she may kiss you. When you say yes, it is careful and brief, a warmth at the corner of the evening rather than a blaze. She smiles afterward — a real one, small and unguarded — and pours more tea as if the world were manageable.",
    "Then I will tell you about the teacher, and you will not have to fix it. Some stories only want a witness. You are good at that. It is the reason the door opened.",
  ),
  iris: hotelScene(
    "iris",
    "The bar is closed and the piano is downstairs, which is a design flaw I complain about and then use. I brought you up because I said one listener, and I try not to bluff about that. Shoes off if you want. Judgment off. That's the dress code.",
    "I still know the set list. I don't miss the applause. I miss the part where a song lands on one face and changes it. If I hum, and you get that face, I will pretend to be very busy with a glass.",
    "No audience is the only way I remember the lyrics correctly. Funny how that works. Stay in the chair or come to the window. Both are good seats.",
    "You and the bluff you left downstairs can relax. I already like you. It's disgusting. Have a zero-proof and cope.",
    "The evening exhaled. So did I. Don't make me say a line about it. Just sit where I can see you enjoy the room.",
    "Come here. I'm not on shift. If I kiss you, it's not a garnish.",
    "She kisses you without the bar between you, unhurried, tasting of citrus and closing time. One hand stays at your jaw like a question that already heard yes. Downstairs, the piano is quiet. She hums four notes anyway, only for the distance between you.",
    "Then I'll tell you which regulars are kind and which ones only tip. You'll be in the first list. You were, before you came upstairs. I don't move people for inventory.",
  ),
  naomi: hotelScene(
    "naomi",
    "The notebooks are on the desk and they are not the point. I invited you because I can count cards and I cannot count what to do with a person I keep writing stars about. Sit. I made tea. It is competent.",
    "The part off the floor: I am afraid that if I stop keeping score I will not know if I am happy or merely winning. You make the score feel beside the point. It's inconvenient. I want more of the inconvenience.",
    "No audience. Good. Then I can admit I starred a joke of yours and it had nothing to do with expected value.",
    "Your bluff is unnecessary. I already ran the numbers. The numbers said invite you. I overruled them and invited you anyway, which is the same outcome with more nerve.",
    "You look like a variable I would refuse to drop from the model. That is the most affectionate sentence I own. I can try a plainer one if you come closer. Or if you don't.",
    "Closer is statistically unwise and personally correct. Yes.",
    "The kiss is brief, almost formal, and then she laughs at herself and kisses you again like she has revised the paper. Her hand finds yours and stays, which she does not annotate.",
    "Then let me explain one hand we both played, and then let me not explain anything. I want to see if I can be quiet next to you without taking notes. I think I can.",
  ),
  yuki: hotelScene(
    "yuki",
    "Truth round. No chips. I invited you because winning isn't the brave part and I wanted to try the brave part without an audience of dealers. You can still leave. I'll still think you're fun. That's the rule.",
    "The true thing: I laugh at busts so nobody asks if I'm okay. I'm okay. I am also tired of being the loud proof that I'm okay. You looked at me like I could be quieter and still be myself. I hated it for one second and then I wanted it.",
    "No audience. Then I might sit down like a normal person. Watch me. Historic.",
    "You brought honesty dressed as a joke. I accept the outfit. I look better in crimson, but I'll allow your approach.",
    "Careful, I'll believe you. I already do. It's annoying and great. Come here or tell me a small truth. Dealer's choice, except I'm not dealing.",
    "Yeah. Come here. If I kiss you I'm going to pretend I won a bet, and then I'm going to stop pretending.",
    "She kisses you quick, like a dare she hopes you'll take, then slower once you do. The grin fades into something unguarded. 'Okay,' she says, forehead to yours. 'That's the scary bet. I like it.'",
    "Small truth: I kept the seat next to me open on purpose tonight. Not strategy. Hope. Don't write it down. Naomi would frame it.",
  ),
  hana: hotelScene(
    "hana",
    "I closed the notebook before you knocked. That was the whole plan. If I open it, stop me. I invited you because the chapter kept trying to steal you and I would rather have you in the room.",
    "Off the record: I am good at seeing what people want and frightened of wanting something back in plain words. I want you to stay long enough that I get bored of performing insight. Boredom would mean I feel safe.",
    "No audience. Then the brooch is just a flower, not a moral. I can live with that for an evening. Sit on the sofa, not the interesting chair. The interesting chair is for people I'm studying.",
    "Your bluff is sweet. You don't have one. Your face already filed the paperwork. I find it disarming, which is a word novelists use when they mean please come here.",
    "The evening exhaled and so did the sentence I was going to say. I'll try a shorter one. I'm glad. That's the sentence.",
    "Closer. And if I kiss you, it doesn't go in the book. That's the condition and the gift.",
    "She kisses you after a pause she would have called a tell in anyone else. It is soft, sure, and slightly smiling. The notebook stays shut. Outside, the neon tries to be a metaphor and, for once, she ignores it.",
    "Then I'll read you one paragraph that isn't about you, and you can tell me if the person in it deserves a kinder ending. I already know my vote. I want yours anyway.",
  ),
  rin: hotelScene(
    "rin",
    "Record's on. You don't have to talk. I asked you up because you can be quiet on purpose. That's rare. Shoes wherever. The song is slow. That's the whole invitation.",
    "What I don't tell the table: my aunt would have liked you. She liked people who let a hand finish. I miss her in a plain way. You don't have to fix the plainness.",
    "No audience. Good. Then I can sit nearer without it meaning a speech.",
    "You made a joke downstairs that I kept. I don't have many. You can have the credit.",
    "Don't flirt like a spotlight. Just… be here. If you want nearer, nearer is fine. I'm saying it so you don't have to guess.",
    "Come here. I'll meet you. That's the whole bravery.",
    "She leans in first, a careful kiss, more warmth than show. Then she settles her head against your shoulder as the record turns over. Neither of you narrates it. The song does enough.",
    "We can listen. I'll say one more thing and then I won't owe the air anything: I'm glad the seat was you.",
  ),
};

const ENCORES: Record<Exclude<CharacterId, "aoi">, string> = {
  reina: "You again. Good. I already put the cards away, so you will have to survive on conversation and the view.",
  akari: "Called it. You're back. I won't say I hoped. My earring, unfortunately, is saying it for me.",
  celeste: "The moon is still busy. I, however, cleared my evening. Come in.",
  mika: "You came back! I have new sketches and the same cocoa. This is my idea of a streak.",
  shiori: "The tea is fresh. The invitation still has no debt attached. Sit wherever you were brave enough to sit last time.",
  iris: "Door's open. Song's optional. Your company isn't a tab.",
  naomi: "I left the notebook closed. Don't look so shocked. Come in before I revert.",
  yuki: "Back for the scary bet? Good. I saved you the non-loud half of the sofa.",
  hana: "Off the record still applies. I missed you in a way that would have been a bad sentence. Hello instead.",
  rin: "You're here. Good. The record just started. We can catch it.",
};

const INVITES: Record<Exclude<CharacterId, "aoi">, { ask: string; decline: string }> = {
  reina: {
    ask: "Aoi will pretend she didn't see this. I won't. If you want a quieter table — my room, no chips, no shoe — come up. If not, deal tomorrow as if I were only your dealer.",
    decline: "Then the felt will do. I don't punish a no. I prefer it to a false yes.",
  },
  akari: {
    ask: "I'm off the floor in an hour and I don't feel like going up alone to congratulate myself. Come see whether I'm bluffing about wanting the company. Hint: I tug my earring when I'm not.",
    decline: "Your loss and mine, and I'll survive both. Try not to be polite about it. Polite is your tell.",
  },
  celeste: {
    ask: "The wheel has had enough of us for one night. I haven't. If you want the epilogue in a room with a lamp and no audience, the door will be unlocked. If not, the story still stands.",
    decline: "Then let the spin be the whole play. I won't rewrite you into an ending you didn't choose.",
  },
  mika: {
    ask: "I get sleepy before the big bettors do, so this is me being brave on a small clock. Want to see the fox sketches? Cocoa is real. Jackpots are not required. You can say no and I'll still cheer your cherries.",
    decline: "All good! Seriously. I'll be on the floor tomorrow with the same grin. Maybe a slightly smaller one. Still real.",
  },
  shiori: {
    ask: "If you would like tea, and a room where no one is performing, my door will be open later. It is not a prize. It is a question. You may decline it without losing anything at the table.",
    decline: "Thank you for a clear no. The shoe will not hear about it. Neither will my face.",
  },
  iris: {
    ask: "After the stools go up, I'm done being furniture. If you want the song — or just the quiet above the bar — come find the door at the end of the service hall. If you'd rather sleep, sleep. I'll still pour you a good one tomorrow.",
    decline: "Then goodnight from this side of the bar. It's a clean no. I respect a clean no more than a crowded yes.",
  },
  naomi: {
    ask: "This is not in the notebook. I would like you to come upstairs, drink competent tea, and let me be a person who invited someone. You can refuse. I will record the refusal as 'reasonable' and not as a wound.",
    decline: "Reasonable. I'll see you at the table. The star stays. It was never conditional.",
  },
  yuki: {
    ask: "Dare: come upstairs and tell me one true thing with no one watching. I'll match it. No chips. If you fold, I still like you. That's the whole dare.",
    decline: "Fold accepted. You don't owe me a story. Find me when you want a loud seat again.",
  },
  hana: {
    ask: "I don't want to write the next part. I want to spend it. If you'd like the off-the-record version of the evening, my room is quieter than this bar. A no is also a complete sentence. I collect those too.",
    decline: "A complete sentence. Thank you. I'll be at the table, brooch and all, without a grudge in the margin.",
  },
  rin: {
    ask: "After hours. Record on. You can come up and not talk. Or talk. I'd like it if you came. If not, that's fine. I'll still be downstairs tomorrow.",
    decline: "Okay. Goodnight.",
  },
};

export const STORY_SCENES: Scene[] = [
  ...SCENES,
  ...Object.entries(INVITES).map(([id, copy]) => inviteScene(id as Exclude<CharacterId, "aoi">, copy.ask, copy.decline)),
  ...Object.values(HOTELS),
  ...Object.entries(ENCORES).map(([id, line]) => encoreScene(id as Exclude<CharacterId, "aoi">, line)),
];

const BY_ID = new Map(STORY_SCENES.map((item) => [item.id, item]));

export function getScene(id: string): Scene | undefined {
  return BY_ID.get(id);
}

export function choiceVisible(choice: ScriptChoice, state: SaveState, characterId?: CharacterId): boolean {
  if (choice.hideFlag && state.flags[choice.hideFlag]) return false;
  if (choice.requiresFlag && !state.flags[choice.requiresFlag]) return false;
  if (choice.minAffinity && characterId && state.relationships[characterId].affinity < choice.minAffinity) return false;
  return true;
}

export function topicsFor(state: SaveState, id: CharacterId, place: ScenePlace): Scene[] {
  return STORY_SCENES.filter((item) => {
    if (item.characterId !== id || item.place !== place) return false;
    if (item.once && state.flags[`seen:${item.id}`]) return false;
    if (item.requiresFlag && !state.flags[item.requiresFlag]) return false;
    if (item.time && !item.time.includes(state.time)) return false;
    return true;
  });
}

export function groupSceneAvailable(state: SaveState): Scene | null {
  const group = getScene("group-bluff");
  if (!group || state.flags.group_bluff) return null;
  if (group.time && !group.time.includes(state.time)) return null;
  return group;
}

const RECOVERY: Record<Exclude<CharacterId, "aoi">, string> = {
  reina: "I want the fair fight, not just the compliment. Deal me in properly.",
  akari: "Read me again. I'll give you a real tell this time.",
  celeste: "Forget the line. What do you actually believe about the wheel?",
  mika: "I want to hear about the game you wish you were building.",
  shiori: "I rushed you before. I'll sit, and I won't make it a performance.",
  naomi: "Ask me to look at the notebook the way you meant it, not as a joke.",
  yuki: "Tell me the brave part that isn't a bust.",
  hana: "I want the reason you come here, off the record.",
  rin: "What are you listening for? I'll be quiet after.",
  iris: "Would you ever sing for one person?",
};

export function checkInScene(state: SaveState, id: CharacterId): Scene {
  const salt = state.evening + state.relationships[id].conversations;
  const opener = checkInLine(id, salt);
  const tones: Exclude<Tone, "leave">[] = ["friendly", "humorous", "curious", "flirtatious"];
  const choices: ScriptChoice[] = tones.map((tone) => ({
    id: tone,
    text:
      tone === "friendly"
        ? "It's good to see you."
        : tone === "humorous"
          ? "I brought a better joke than my last bet."
          : tone === "curious"
            ? "What's on your mind tonight?"
            : "You look unfairly lovely in this light.",
    tone,
    next: tone,
    effects: {
      memory: state.flags[`checkin:${id}`] ? undefined : `You and ${CHARACTERS[id].name} talked easily, away from the stakes.`,
      flags: [`checkin:${id}`],
    },
  }));
  if (id !== "aoi" && !state.flags[STORY_FLAG[id]] && state.relationships[id].conversations >= 1) {
    choices.unshift({
      id: "recover",
      text: RECOVERY[id],
      tone: CHARACTERS[id].likes[0] ?? "curious",
      next: "recover",
      effects: {
        flags: [STORY_FLAG[id]],
        memory: `You found a truer question for ${CHARACTERS[id].name}.`,
        completeScene: true,
      },
    });
  }
  const nodes: ScriptNode[] = [
    { id: "start", speaker: id, text: opener, choices },
    ...tones.map((tone) => ({
      id: tone,
      speaker: id as ScriptNode["speaker"],
      text: toneReply(id, tone),
      next: "end",
    })),
    {
      id: "recover",
      speaker: id,
      text: id === "shiori" ? "…Stay, then. That was the right question." : "There. That one I'll keep.",
      next: "end",
    },
    endNode("end", "narration", "The exchange settles somewhere you can find it later, in the journal of the night.", "talk"),
  ];
  return scene({
    id: `checkin-${id}`,
    title: "A minute",
    characterId: id,
    place: "bar",
    entry: "start",
    nodes,
  });
}

export function fillName(text: string, name: string): string {
  return text.replaceAll("{name}", name);
}
