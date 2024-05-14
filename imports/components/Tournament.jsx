import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DateIcon from '@mui/icons-material/Event';
import TimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import DivisionIcon from '@mui/icons-material/Groups';
import SurfaceIcon from '@mui/icons-material/Water';
import FemaleIcon from '@mui/icons-material/Female';
import PlayersIcon from '@mui/icons-material/Wc';
import StateIcon from '@mui/icons-material/MarkEmailRead';
import MenuButton from './MenuButton.jsx';
import { Chip, Divider, IconButton, Skeleton, Slide } from '@mui/material';
import AdminStuff from './AdminStuff.jsx';
import { useTracker } from 'meteor/react-meteor-data';
import UltiSite from '../Ultisite.js';
import { useParams } from 'react-router-dom';
import TeamState from './TeamState.jsx';
import TournamentEdit from './TournamentEdit.jsx';
import TournamentParticipant from './TournamentParticipant.jsx';
import { participantList } from '../helpers.js';
import TournamentParticipantAdd from './TournamentParticipantAdd.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import AddIcon from '@mui/icons-material/Add';
import TeamEdit from './TeamEdit.jsx';

/**
 * Single Tournament
 * @param {object} props
 * @param {object} props.tournament
 * @returns
 */
const Tournament = () => {
  const [edit, setEdit] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState();
  const [teamEdit, setTeamEdit] = useState();
  const params = useParams();
  const tournamentId = params.tournamentId;
  const { tournament, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('tournamentDetails', tournamentId || '');

    return {
      tournament: UltiSite.Tournaments.findOne({ _id: tournamentId }),
      isLoading: !handler.ready(),
    };
  });
  useEffect(() => {
    if (!expandedTeam && tournament && tournament.teams?.length === 1) setExpandedTeam(tournament.teams[0]._id);
  }, [expandedTeam, tournament]);

  console.log({ tournament, params, isLoading });
  return (
    <Box sx={{ width: '100%' }} flexDirection="column" display="flex" gap={2}>
      {tournament ? (
        <>
          <ErrorBoundary>
            <TournamentEdit open={edit} tournament={tournament} onClose={() => setEdit(false)} />
          </ErrorBoundary>
          <ErrorBoundary>
            <TeamEdit
              open={!!teamEdit}
              team={teamEdit || {}}
              tournament={tournament}
              onClose={() => setTeamEdit(null)}
            />
          </ErrorBoundary>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h4">
              {tournament.name} <Typography variant="body1">In {tournament.address?.city}</Typography>
            </Typography>
            <AdminStuff>
              <MenuButton>
                <MenuItem onClick={() => setEdit(true)}>Turnier Bearbeiten</MenuItem>
                {(tournament.teams || []).map((team) => (
                  <MenuItem key={team._id} onClick={() => setTeamEdit(team)}>
                    {team.name} bearbeiten
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => setTeamEdit({})}>Team hinzufügen</MenuItem>
              </MenuButton>
            </AdminStuff>
          </Box>
          <Box display="Flex" gap={1}>
            <Chip icon={<DateIcon />} label={tournament.date?.toLocaleDateString()} variant="outlined" />
            <Chip icon={<TimeIcon />} label={`${tournament.numDays} Tage`} variant="outlined" />
            <Chip icon={<CategoryIcon />} label={tournament.category} variant="outlined" />
            {(tournament.divisions || []).map((d) => (
              <Chip key={d} icon={<DivisionIcon />} label={d} variant="outlined" />
            ))}
            {(tournament.surfaces || []).map((d) => (
              <Chip key={d} icon={<SurfaceIcon />} label={d} variant="outlined" />
            ))}
          </Box>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Paper flex={1}>
              <Box display="flex" flexDirection="column" padding={2}>
                <Typography variant="h5">Infos</Typography>
                {(tournament.description || []).map((desc, idx) => (
                  <Box key={desc.date || idx}>
                    <Typography variant="caption">{desc.date?.toLocaleString()}</Typography>
                    <Typography variant="body1" maxWidth={400} dangerouslySetInnerHTML={{ __html: desc.content }} />
                  </Box>
                ))}
              </Box>
            </Paper>
            {(tournament.teams || []).map((team) => {
              return (
                <Box key={team._id} flex={1}>
                  <Paper>
                    <Box display="flex" padding={2}>
                      <Box flexGrow={1} width="100%">
                        <Typography variant="h5">{team.name}</Typography>
                        <Chip icon={<DivisionIcon />} label={team.division} variant="outlined" />
                        <Chip icon={<PlayersIcon />} label={team.maxPlayers} variant="outlined" />
                        <Chip icon={<FemaleIcon />} label={team.minFemale} variant="outlined" />
                        <Chip icon={<StateIcon />} label={team.state} variant="outlined" />
                      </Box>
                      <TeamState team={team} />
                    </Box>
                    <Box display="flex" flexDirection="column" padding={2}>
                      {participantList({ tournament, team }).map((p) => (
                        <ErrorBoundary key={p._id}>
                          <TournamentParticipant participant={p} />
                        </ErrorBoundary>
                      ))}
                      <ErrorBoundary>
                        <TournamentParticipantAdd team={team} tournament={tournament} />
                      </ErrorBoundary>
                    </Box>
                  </Paper>
                </Box>
              );
            })}
            {(tournament.teams || []).length === 0 ? (
              <Box flex={1} width="100%">
                <Button size="large"  onClick={() => setTeamEdit({})} fullWidth variant="contained" color="primary">
                  <AddIcon />
                  Team anlegen
                </Button>
              </Box>
            ) : null}
          </Box>
        </>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="60%" height={24} />
          <Box display="flex" gap={2} width="100%">
            <Skeleton variant="text" width="10%" height={32} />
            <Skeleton variant="text" width="10%" height={32} />
            <Skeleton variant="text" width="10%" height={32} />
            <Skeleton variant="text" width="10%" height={32} />
          </Box>
          <Box display="flex" gap={2} width="100%">
            <Box flex={1}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
            </Box>
            <Box flex={1}>
              <Skeleton variant="rectangular" width="100%" height={200} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="70%" height={24} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Tournament;
