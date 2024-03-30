import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Box from '@mui/material/Box';
import UltiSite from '../Ultisite';
import WikiPage from './WikiPage.jsx';
import Tournament from './Tournament.jsx';
import { Card, CardActionArea, CardContent, CardHeader, LinearProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { aggregateTeamInfo } from '../helpers';
import TeamState from './TeamState.jsx';

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('Tournaments');

    if (!handler.ready()) {
      return {
        tournaments: [],
        isLoading: true,
      };
    }

    return {
      tournaments: UltiSite.Tournaments.find({}, { limit: 10 }).fetch(),
    };
  });
  console.log({ tournaments, isLoading });
  return (
    <Box display="flex" flexDirection="column" gap={2} alignItems="center">
      <WikiPage name="Turniere" />
      {isLoading ? (
        <Tournament />
      ) : (
        <>
          {tournaments.map((tournament) => (
            <Card sx={{ maxWidth: 800, minWidth: 300, flex: 1, width: '100%' }} key={tournament._id}>
              <CardActionArea onClick={() => navigate(`/turnier/${tournament._id}`)}>
                <CardHeader
                  title={tournament.name}
                  subheader={`In ${tournament.address.city} am ${new Date(tournament.date).toLocaleDateString()}`}
                />
                <CardContent>
                  <Box display="flex" flexDirection="row" gap={2} flexWrap="wrap">
                    <Box  position="relative" height={100} width="100%" flex={1}>
                      {tournament.numDays} Tage {tournament.category}<br/>
                      Divisionen: {tournament.divisions.join(', ')}<br/>
                      Untergrund: {tournament.surfaces.join(', ')}
                    </Box>
                    {(tournament.teams || []).map((team) => {
                      return (
                        <Box key={team._id} position="relative" height={100} flex={1} width="100%">
                          <TeamState team={team} />
                          <Box position="absolute" bottom={0} left={0} textAlign="center" width="100%">
                            {team.name}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          {tournaments.length === 0 ? <Typography>Aktuell keine Turniere</Typography> : null}
        </>
      )}
    </Box>
  );
};

export default Tournaments;
