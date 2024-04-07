import { first, rest, sortBy } from 'lodash';

export const getClientUrl = (target, params) => {
  return `/${target}?`;
};
export const percentStateToState = (percent) => {
  if (percent > 90) {
    return 3;
  } else if (percent > 50) {
    return 2;
  } else if (percent > 10) {
    return 1;
  }
  return 0;
};

/** takes a state between 1 and 4 to map it to 0 to 100 */
export const stateToPercentState = (state) => {
  if (state===4) {
    return 100;
  } else if (state===3) {
    return 75;
  } else if (state===2) {
    return 25;
  }
  return 0;
};


export const aggregateTeamInfo = ({ participants, maxPlayers, minFemale }) => {
  let full = 0;
  let half = 0;
  let rest = 0;
  let femalesFull = 0;
  let femalesHalf = 0;
  if (participants) {
    participants.forEach(function (participant) {
      if (participant.state > 90) {
        full += 1;
        if (participant.sex === 'W') femalesFull += 1;
      } else if (participant.state > 50) {
        half += 1;
        if (participant.sex === 'W') femalesHalf += 1;
      } else if (participant.state > 10) {
        rest += 1;
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
    over: max - maxPlayers,
    full,
    all: full + half,
    half,
    rest,
    spots: maxPlayers - full,
    femalesFull,
    femalesHalf,
    missingFemales: Math.max(0, minFemale - femalesFull - femalesHalf),
  };
};

export const participantList = ({ team, tournament }) => {
  let participants = sortBy(
    sortBy(
      tournament.participants.filter((p) => p.team === team._id),
      'safeStateDate'
    ),
    (p) => {
      return 100 - p.state;
    }
  );
  // adjust list by drawing result
  if (team.drawingResult) {
    participants = sortBy(
      sortBy(
        sortBy(
          tournament.participants
            .filter((p) => p.team === team._id)
            .map((x) => (x.drawing === null ? { ...x, drawing: 1000 } : x)),
          'safeStateDate'
        ),
        (p) => 100 - p.state
      ),
      'drawing'
    );
  }
  const partUser = participants.map(function (participant, idx) {
    const user = Meteor.users.findOne(participant.user);
    const p = {
      iconState:
        participant.drawing === 0
          ? 'clock'
          : participant.drawing && participant.drawing !== 1000
          ? 'magic'
          : idx < team.maxPlayers / 2
          ? 'clock'
          : 'empty',
      ...user,
      ...participant,
    };
    return p;
  });
  if (team.drawingResult) {
    // check females
    let females = 0;
    let femalesWaiting = 0;
    partUser.forEach((part, idx) => {
      if (part.sex === 'W') {
        if (idx >= team.maxPlayers) {
          femalesWaiting++;
        } else {
          females++;
        }
      }
    });
    console.log('Female state:', females, femalesWaiting, team.minFemale);
    if (females < team.minFemale && femalesWaiting > 0) {
      const players = sortBy(first(partUser, team.maxPlayers), (p) => {
        return p.sex === 'W' ? 0 : 1;
      });
      const waiting = sortBy(rest(partUser, team.maxPlayers), (p) => {
        return p.sex === 'W' ? 0 : 1;
      });
      let switches = 0;
      while (females < team.minFemale && femalesWaiting > 0) {
        const temp = players[players.length - switches - 1];
        players[players.length - switches - 1] = waiting[switches];
        players[players.length - switches - 1].iconState = 'fa fa-venus-mars';
        waiting[switches] = temp;
        femalesWaiting--;
        females++;
        switches++;
      }
      participants = players.concat(waiting);
    } else {
      participants = partUser;
    }
  } else {
    participants = partUser;
  }
  return participants.map((p, idx) => {
    return { ...p, waiting: team.maxPlayers === idx, _id: p.user };
  });
};
