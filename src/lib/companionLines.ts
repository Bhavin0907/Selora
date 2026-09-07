import type { SoulMood } from '../types'
import { formatINR } from './stats'

export interface CompanionLine {
  headline: string
  text: string
  mood: SoulMood
}

interface LineTemplate {
  headline: string
  text: string | ((amount: number, reason?: string) => string)
}

const LINES: Record<SoulMood, {
  save: LineTemplate[]
  spendNormal: LineTemplate[]
  spendImpulse: LineTemplate[]
}> = {
  thriving: {
    save: [
      {
        headline: 'VAULT LEVEL UP!',
        text: (amt) => `+${formatINR(amt)} to the treasure chest! Our floating island is glittering.`,
      },
      {
        headline: 'SHINING BRIGHT!',
        text: 'Another deposit! Even the elder dragons are jealous of our hoard.',
      },
      {
        headline: 'PURE MAGIC!',
        text: 'Every coin fuels my aura! At this rate, we will be unstoppable.',
      },
      {
        headline: 'LEGENDARY DISCIPLINE!',
        text: 'The kingdom salutes your restraint. The vault grows mighty!',
      },
      {
        headline: 'MAX HEALTH GLOW!',
        text: 'Look at those gold sparkles! Keep feeding our savings goal, hero!',
      },
    ],
    spendNormal: [
      {
        headline: 'SUPPLIES ACQUIRED!',
        text: (amt) => `${formatINR(amt)} well traded. A hero needs proper provisions for the road!`,
      },
      {
        headline: 'FAIR TRADE!',
        text: 'Budgeted and balanced. The royal ledger is still in peak condition!',
      },
      {
        headline: 'TOWN VISIT!',
        text: 'Good transaction at the market stall. Our savings buffer can easily handle it.',
      },
      {
        headline: 'CALCULATED EXPENSE!',
        text: 'No sweat for a high-level hero. Just remember to top off the pouch later!',
      },
      {
        headline: 'GEAR INSPECTED!',
        text: 'Merchant satisfied. Our emerald aura is holding strong as steel.',
      },
    ],
    spendImpulse: [
      {
        headline: 'WHOA THERE!',
        text: (amt) => `${formatINR(amt)} on an impulse raid? Let's not wake the storm clouds!`,
      },
      {
        headline: 'UNEXPECTED DETOUR!',
        text: 'Oof! That wasn’t written in the quest log, hero! Let’s tread carefully.',
      },
      {
        headline: 'EASY WITH THE POUCH!',
        text: 'Impulse siren songs are sneaky. Take a breath before the next shop!',
      },
      {
        headline: 'GUARD UP!',
        text: 'My sparkles flickered just a bit! Keep an eye on non-essential drains.',
      },
      {
        headline: 'TEMPTATION CHECK!',
        text: 'We have big fortress dreams! Don’t let quick shiny trinkets distract us.',
      },
    ],
  },

  content: {
    save: [
      {
        headline: 'NICE DEPOSIT!',
        text: (amt) => `+${formatINR(amt)} banked! Another solid stone in our fortress wall.`,
      },
      {
        headline: 'STEADY PROGRESS!',
        text: 'Slow and steady wins the grand campaign. Feeling warm and cozy!',
      },
      {
        headline: 'COIN BY COIN!',
        text: 'Consistency is our best spell. The purple aura is brightening up!',
      },
      {
        headline: 'VAULT GROWS HEAVIER!',
        text: 'Heavier vault, lighter spirit. You are doing fantastic, hero.',
      },
      {
        headline: 'WARM EMBERS!',
        text: 'That deposit hit just right! We are climbing back toward thriving.',
      },
    ],
    spendNormal: [
      {
        headline: 'MERCHANT PAID!',
        text: (amt) => `${formatINR(amt)} logged. Keeping our balance steady; on with the journey!`,
      },
      {
        headline: 'ROAD EXPENSE!',
        text: 'Standard toll paid. Remember to check in on our weekly pact soon!',
      },
      {
        headline: 'SUPPLIES CHECKED!',
        text: 'A reasonable buy. Let’s balance it with a small deposit when you can.',
      },
      {
        headline: 'MARKET TRADE!',
        text: 'Coins exchanged without drama. The balance sheet remains calm.',
      },
      {
        headline: 'ORDERLY SPEND!',
        text: 'Tracked and accounted for. Awareness is half the battle won!',
      },
    ],
    spendImpulse: [
      {
        headline: 'IMPULSE DETECTED!',
        text: (amt) => `Ouch, ${formatINR(amt)} on impulse? Those quick buys pile up faster than slimes!`,
      },
      {
        headline: 'PAUSE BEFORE BUYING!',
        text: 'A 24-hour waiting rule could have saved those coins, hero!',
      },
      {
        headline: 'SHAKY MOVE!',
        text: 'My aura wobbled a bit! Let’s keep our focus on the savings target.',
      },
      {
        headline: 'RADAR PING!',
        text: 'That was an impulse strike! Let’s retreat to safety before logging more.',
      },
      {
        headline: 'CAUTION AHEAD!',
        text: 'Temptations lurk in every shop! Protect your hard-earned gold stash.',
      },
    ],
  },

  worried: {
    save: [
      {
        headline: 'PHEW, RELIEF!',
        text: (amt) => `Saved ${formatINR(amt)}! My jittery aura feels soothed already. Thank you!`,
      },
      {
        headline: 'HEALING POTION!',
        text: 'A lifeline for our vault! Every deposit helps pull us out of the woods.',
      },
      {
        headline: 'RECOVERY UNDERWAY!',
        text: 'Yes! That is the disciplined hero I know. Let’s build a streak!',
      },
      {
        headline: 'TURNING THE TIDE!',
        text: 'The gold warning light is calming down. One more save will do wonders!',
      },
      {
        headline: 'BREATH OF FRESH AIR!',
        text: 'Every rupee counts right now. We can definitely turn this around!',
      },
    ],
    spendNormal: [
      {
        headline: 'HEAVY TOLL...',
        text: (amt) => `${formatINR(amt)} spent... The vault is feeling a bit hollow, hero.`,
      },
      {
        headline: 'CAREFUL OUT THERE!',
        text: 'Watching the gold slip away makes my whiskers twitch. Tread lightly!',
      },
      {
        headline: 'ANOTHER DRAIN...',
        text: 'We are in a tight spot. Can we pause non-essentials until next week?',
      },
      {
        headline: 'LOW RESERVES!',
        text: 'The emergency buffer is shrinking. Let’s seek out a savings quest!',
      },
      {
        headline: 'EXPEDITION STRAIN!',
        text: 'Coins are running low. Let’s keep spending locked down for now.',
      },
    ],
    spendImpulse: [
      {
        headline: 'DANGER ZONE!',
        text: (amt) => `${formatINR(amt)} IMPULSE?! My health bar is sweating right now!`,
      },
      {
        headline: 'NOT AN IMPULSE NOW!',
        text: 'We really can’t afford impulse raids in this condition! Please pause!',
      },
      {
        headline: 'ALARM BELLS!',
        text: 'The storm fortress is growing taller! We need shields up, not spending!',
      },
      {
        headline: 'MAYDAY!',
        text: 'That impulse buy hurt! We need a deposit quest stat to stop the bleeding!',
      },
      {
        headline: 'CRITICAL WARNING!',
        text: 'One more impulse might push us into the deep red zone! Stay disciplined!',
      },
    ],
  },

  distressed: {
    save: [
      {
        headline: 'CRITICAL REVIVE!',
        text: (amt) => `+${formatINR(amt)}! A LIFELINE! You pulled me back from zero HP!`,
      },
      {
        headline: 'HERO TO THE RESCUE!',
        text: 'I felt that heal right down to my last pixel! Thank you, hero!',
      },
      {
        headline: 'SPARK OF HOPE!',
        text: 'The red darkness is retreating! We can rebuild from here, brick by brick!',
      },
      {
        headline: 'PHOENIX FLAME!',
        text: 'We survived the storm! Let’s keep this rescue momentum burning!',
      },
      {
        headline: 'VAULT DEFIBRILLATOR!',
        text: 'My heartbeat is stabilizing! Please don’t stop saving now!',
      },
    ],
    spendNormal: [
      {
        headline: 'HEALTH CRITICAL!',
        text: (amt) => `${formatINR(amt)} gone... The vault is on life support. Survival mode only!`,
      },
      {
        headline: 'EMPTY POCKETS...',
        text: 'Every coin out right now hurts my soul. Let’s freeze all discretionary buys!',
      },
      {
        headline: 'I’M TREMBLING...',
        text: 'We desperately need a redemption quest. Please log a deposit soon...',
      },
      {
        headline: 'CRITICAL DRAIN!',
        text: 'The fortress is falling into ruins! We must seal the vault doors immediately!',
      },
      {
        headline: 'SURVIVAL PROTOCOL!',
        text: 'Only emergency supplies from here on. We must protect what remains!',
      },
    ],
    spendImpulse: [
      {
        headline: 'CRITICAL DAMAGE!',
        text: (amt) => `CRITICAL HIT! ${formatINR(amt)} on impulse?! My pixels are glitching out!`,
      },
      {
        headline: 'CODE RED ALARM!',
        text: 'We are in the emergency room and buying trinkets?! Stop the madness!',
      },
      {
        headline: 'MY PIXELS ARE CRYING!',
        text: 'Ouuuch! That impulse strike knocked out the last of my shields!',
      },
      {
        headline: 'FULL MELTDOWN!',
        text: 'The storm has fully taken over! Retreat to savings safety immediately!',
      },
      {
        headline: 'ZERO HP WARNING!',
        text: 'I cannot take any more impulse damage! Please, put the purse away!',
      },
    ],
  },
}

/**
 * Returns a random companion reaction line tailored to the soul's mood,
 * transaction kind, amount, and reason.
 */
export function getCompanionLine(
  mood: SoulMood,
  kind: 'save' | 'spend',
  amount: number,
  reason?: string,
): CompanionLine {
  const moodLines = LINES[mood] ?? LINES.content
  const isImpulse = kind === 'spend' && reason?.toLowerCase() === 'impulse'

  const pool = kind === 'save'
    ? moodLines.save
    : isImpulse
      ? moodLines.spendImpulse
      : moodLines.spendNormal

  const choice = pool[Math.floor(Math.random() * pool.length)]
  const text = typeof choice.text === 'function' ? choice.text(amount, reason) : choice.text

  return {
    headline: choice.headline,
    text,
    mood,
  }
}
