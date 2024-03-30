export const getClientUrl = (target, params) => {
  return `/${target}?`;
};

export const aggregateTeamInfo = ({ participants, maxPlayers, minFemale }) => {
  let full = 0;
  let half = 0;
  let rest = 0;
  let females = 0;
  if (participants) {
    participants.forEach(function (participant) {
      if (participant.state > 90) {
        full += 1;
      } else if (participant.state > 50) {
        half += 1;
      } else if (participant.state > 10) {
        rest += 1;
      }
      if (participant.sex === 'W') {
        females += 1;
      }
    });
  }
  if (full + half + rest === 0) {
    return undefined;
  }
  const max = Math.max(maxPlayers, full + half + rest);
  if (full > maxPlayers) {
    full = maxPlayers;
    rest = 0;
    half = 0;
  }
  if (full + half > maxPlayers) {
    half = maxPlayers - full;
    rest = 0;
  }
  if (full + half + rest > maxPlayers) {
    rest = maxPlayers - full - half;
  }

  return {
    percentFull: full * (100 / max),
    percentHalf: half * (100 / max),
    percentRest: rest * (100 / max),
    percentOver: (max - maxPlayers) * (100 / max),
    over: max - maxPlayers,
    full,
    all: full + half,
    half,
    rest,
    spots: maxPlayers - full,
    females,
    percentFemales: females * (100 / minFemale),
    missingFemales: Math.max(0, minFemale - females),
  };
};
