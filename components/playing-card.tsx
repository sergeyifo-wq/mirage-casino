import type { CSSProperties } from "react";
import { isRedSuit, rankLabel, type Card, type Suit } from "@/lib/cards";
import styles from "./playing-card.module.css";

const SUIT_NAME = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 70]],
  2: [
    [50, 34],
    [50, 106],
  ],
  3: [
    [50, 34],
    [50, 70],
    [50, 106],
  ],
  4: [
    [33, 34],
    [67, 34],
    [33, 106],
    [67, 106],
  ],
  5: [
    [33, 34],
    [67, 34],
    [50, 70],
    [33, 106],
    [67, 106],
  ],
  6: [
    [33, 34],
    [67, 34],
    [33, 70],
    [67, 70],
    [33, 106],
    [67, 106],
  ],
  7: [
    [33, 34],
    [67, 34],
    [50, 52],
    [33, 70],
    [67, 70],
    [33, 106],
    [67, 106],
  ],
  8: [
    [33, 34],
    [67, 34],
    [50, 52],
    [33, 70],
    [67, 70],
    [50, 88],
    [33, 106],
    [67, 106],
  ],
  9: [
    [33, 34],
    [67, 34],
    [33, 58],
    [67, 58],
    [50, 70],
    [33, 82],
    [67, 82],
    [33, 106],
    [67, 106],
  ],
  10: [
    [33, 34],
    [67, 34],
    [50, 46],
    [33, 58],
    [67, 58],
    [33, 82],
    [67, 82],
    [50, 94],
    [33, 106],
    [67, 106],
  ],
};

function SuitMark({
  suit,
  x = 0,
  y = 0,
  size = 16,
  rotate = false,
}: {
  suit: Suit;
  x?: number;
  y?: number;
  size?: number;
  rotate?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate ? 180 : 0}) scale(${size / 24}) translate(-12 -12)`}
      fill="currentColor"
    >
      {suit === "d" ? (
        <path d="M12 1 22 12 12 23 2 12Z" />
      ) : suit === "h" ? (
        <path d="M12 22C10 19 1 13 1 7A6 6 0 0 1 12 4 6 6 0 0 1 23 7C23 13 14 19 12 22Z" />
      ) : suit === "s" ? (
        <path d="M12 1C9 5 1 10 1 15A6 6 0 0 0 11 18L8 23H16L13 18A6 6 0 0 0 23 15C23 10 15 5 12 1Z" />
      ) : (
        <path d="M12 1a6 6 0 0 0-5 9 6 6 0 1 0 4 10l-3 3h8l-3-3a6 6 0 1 0 4-10A6 6 0 0 0 12 1Z" />
      )}
    </g>
  );
}

function Court({ rank, suit }: { rank: number; suit: Suit }) {
  const queen = rank === 12;
  const king = rank === 13;
  return (
    <g>
      <path d="M28 70V39Q28 23 45 25Q64 19 67 39V60L75 70Z" fill="#d3b274" />
      <path
        d="M33 40Q26 32 37 28Q48 20 57 29Q65 28 62 42L57 55H38Z"
        fill="#252c3c"
      />
      <path
        d="M39 38Q49 30 59 39L58 48Q55 60 49 60Q40 57 39 48Z"
        fill="#efd8b3"
        stroke="#b8965b"
        strokeWidth=".7"
      />
      {queen && (
        <path
          d="M33 38Q28 45 35 63L41 57 38 42M60 38Q69 45 61 64L56 57 62 43"
          fill="#252c3c"
        />
      )}
      {king && (
        <path d="M40 47Q48 51 57 47L55 57 49 64 42 58Z" fill="#5a423a" />
      )}
      <path
        d="M43 43h3m7 0h3M49 44l-1 5h3"
        fill="none"
        stroke="#674939"
        strokeWidth="1.1"
      />
      {!king && (
        <path d="M47 53q3 2 6 0" fill="none" stroke="#9d4750" strokeWidth="1" />
      )}
      <path
        d={
          queen
            ? "M35 28 38 19 44 25 50 17 56 25 63 19 63 30Z"
            : "M34 28 34 17 42 22 48 13 54 22 63 17 63 30Z"
        }
        fill="#d6ad58"
        stroke="#806137"
        strokeWidth="1"
      />
      <circle cx="49" cy="24" r="2" fill="currentColor" />
      <path
        d="M24 70 32 61 43 57 50 66 57 57 67 61 77 70Z"
        fill="currentColor"
        stroke="#af884b"
        strokeWidth="1"
      />
      <path
        d="M34 61 42 70M65 61 58 70M44 61 49 67 55 61"
        fill="none"
        stroke="#e7c983"
        strokeWidth="2"
      />
      <path
        d="M26 36V65M25 35 22 30 26 26 30 30Z"
        fill="#ddbf77"
        stroke="#936a35"
        strokeWidth="1"
      />
      <SuitMark suit={suit} x={72} y={42} size={10} />
    </g>
  );
}

export function PlayingCard({
  card,
  hidden = false,
  delay = 0,
}: {
  card?: Card;
  hidden?: boolean;
  delay?: number;
}) {
  const faceDown = hidden || !card;
  const rank = card?.rank === 14 ? 1 : (card?.rank ?? 1);
  const rankName =
    (
      { 1: "Ace", 11: "Jack", 12: "Queen", 13: "King" } as Record<
        number,
        string
      >
    )[rank] ?? String(rank);
  return (
    <div
      className={`${styles.card} ${faceDown ? styles.back : styles.front} deal-in`}
      style={
        {
          animationDelay: `${delay}ms`,
          "--card-ink": card && isRedSuit(card.suit) ? "#9c233c" : "#192737",
        } as CSSProperties
      }
      role="img"
      aria-label={
        faceDown ? "Face-down card" : `${rankName} of ${SUIT_NAME[card.suit]}`
      }
    >
      {faceDown ? (
        <svg viewBox="0 0 100 140" aria-hidden="true">
          <rect
            x="6"
            y="6"
            width="88"
            height="128"
            rx="5"
            fill="none"
            stroke="#dcc18b"
            strokeWidth=".8"
          />
          <rect
            x="10"
            y="10"
            width="80"
            height="120"
            rx="3"
            fill="none"
            stroke="#dcc18b"
            strokeWidth=".35"
          />
          {[24, 43, 62, 81, 100, 119].map((y) =>
            [20, 40, 60, 80].map((x) => (
              <path
                key={`${x}:${y}`}
                d={`M${x} ${y - 7}l7 7-7 7-7-7Z`}
                fill="none"
                stroke="#d4b170"
                opacity=".3"
                strokeWidth=".6"
              />
            )),
          )}
          <path
            d="M50 31 77 70 50 109 23 70Z"
            fill="#25172d"
            stroke="#d6b774"
            strokeWidth="1.2"
          />
          <path
            d="M50 40 69 70 50 100 31 70Z"
            fill="none"
            stroke="#d6b774"
            strokeWidth=".5"
          />
          <path d="M56 52a17 17 0 1 0 0 35 20 20 0 0 1 0-35Z" fill="#d6b774" />
          <path d="m57 64 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#f1ddb5" />
          <text
            x="50"
            y="22"
            textAnchor="middle"
            fill="#e2c791"
            fontSize="5.5"
            letterSpacing="2"
          >
            MIRAGE
          </text>
          <text
            transform="rotate(180 50 70)"
            x="50"
            y="22"
            textAnchor="middle"
            fill="#e2c791"
            fontSize="5.5"
            letterSpacing="2"
          >
            MIRAGE
          </text>
        </svg>
      ) : (
        <svg
          viewBox="0 0 100 140"
          aria-hidden="true"
          style={{ color: "var(--card-ink)" }}
        >
          <rect
            x="4"
            y="4"
            width="92"
            height="132"
            rx="6"
            fill="none"
            stroke="#ae8c51"
            strokeWidth=".45"
            opacity=".55"
          />
          {[false, true].map((flipped) => (
            <g
              key={String(flipped)}
              transform={flipped ? "rotate(180 50 70)" : undefined}
            >
              <text
                x="13"
                y="20"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="Georgia,serif"
                fontWeight="bold"
                fontSize={rank === 10 ? 15 : 18}
              >
                {rankLabel(rank)}
              </text>
              <SuitMark suit={card.suit} x={13} y={31} size={11} />
            </g>
          ))}
          {rank <= 10 ? (
            PIPS[rank].map(([x, y], index) => (
              <SuitMark
                key={index}
                suit={card.suit}
                x={x}
                y={y}
                size={rank === 1 ? 37 : 17}
                rotate={y > 70}
              />
            ))
          ) : (
            <>
              <rect
                x="23"
                y="15"
                width="54"
                height="110"
                fill="#e9dfc5"
                stroke="#ad8b53"
                strokeWidth=".6"
              />
              <Court rank={rank} suit={card.suit} />
              <g transform="rotate(180 50 70)">
                <Court rank={rank} suit={card.suit} />
              </g>
              <path d="M24 70h52" stroke="#ad8b53" strokeWidth=".7" />
            </>
          )}
          {rank === 1 && (
            <text
              x="50"
              y="105"
              textAnchor="middle"
              fontFamily="Georgia,serif"
              fill="#9a8156"
              fontSize="5"
              letterSpacing="1.5"
            >
              MIDNIGHT MIRAGE
            </text>
          )}
        </svg>
      )}
    </div>
  );
}
