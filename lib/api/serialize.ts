import type { Partner } from "../game-logic/types";

interface DrawnCardWithCard {
  id: string;
  partner: Partner;
  timesPassed: number;
  answeredAt: Date | null;
  card: { id: string; theme: string | null; level: string; text: string; curveballNo: number | null };
  decisionLog?: { note: string } | null;
}

export function serializeDrawnCard(drawnCard: DrawnCardWithCard) {
  return {
    drawnCardId: drawnCard.id,
    partner: drawnCard.partner,
    timesPassed: drawnCard.timesPassed,
    answeredAt: drawnCard.answeredAt,
    answered: drawnCard.answeredAt !== null,
    card: {
      id: drawnCard.card.id,
      theme: drawnCard.card.theme,
      level: drawnCard.card.level,
      text: drawnCard.card.text,
      curveballNo: drawnCard.card.curveballNo,
    },
    decisionNote: drawnCard.decisionLog?.note ?? null,
  };
}
