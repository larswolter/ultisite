import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import PracticeMap from './PracticeMap.jsx';
import ExpandIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MenuButton from './MenuButton.jsx';
import { Collapse, IconButton, Skeleton, Slide } from '@mui/material';
import AdminStuff from './AdminStuff.jsx';
import { useTracker } from 'meteor/react-meteor-data';
import UltiSite from '../Ultisite.js';
import { useParams } from 'react-router-dom';
import TeamState from './TeamState.jsx';

/**
 * Single Tournament
 * @param {object} props
 * @param {object} props.tournament
 * @returns
 */
const Tournament = () => {
  const [edit, setEdit] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState();
  const params = useParams();
  const tournamentId = params.tournamentId;
  const { tournament, isLoading } = useTracker(() => {
    const handler = Meteor.subscribe('tournamentDetails', tournamentId);

    return {
      tournament: UltiSite.Tournaments.findOne({ _id: tournamentId }),
      isLoading: !handler.ready(),
    };
  });
  useEffect(() => {
    if (!expandedTeam && tournament && tournament.teams.length === 1) setExpandedTeam(tournament.teams[0]._id);
  }, [expandedTeam, tournament]);
  console.log({ tournament, params, isLoading });
  return edit && tournament ? (
    <Paper sx={{ maxWidth: 600, minWidth: 300, flex: 1, width: '100%' }}>
      <form
        onSubmit={(evt) => {
          evt.preventDefault();
          const data = {};
          [...evt.target.getElementsByTagName('input')].forEach((input) => {
            if ('date' === input.type) data[input.name] = input.valueAsDate;
            else if ('number' === input.type) data[input.name] = input.valueAsNumber;
            else data[input.name] = input.value;
          });
          console.log(data);
          Meteor.callAsync('updatePractice', tournament._id, { $set: data })
            .then(() => {
              setEdit(false);
            })
            .catch((err) => {
              console.error(err);
            });
          return false;
        }}>
        <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="space-evenly" gap={2} padding={2}>
          <TextField fullWidth label="Veranstalter" name="hostingTeam" defaultValue={tournament.hostingTeam} />
          <TextField fullWidth label="Wochentag" name="weekday" defaultValue={tournament.weekday} />
          <TextField
            label="Erstes Training"
            name="start"
            type="date"
            sx={{ width: '50%' }}
            defaultValue={new Date(tournament.start).toISOString().substr(0, 10)}
          />
          <TextField
            label="Letztes Training"
            name="end"
            type="date"
            sx={{ width: '50%' }}
            defaultValue={new Date(tournament.end).toISOString().substr(0, 10)}
          />
          <TextField label="Beginn" name="startTime" sx={{ width: '50%' }} defaultValue={tournament.startTime} />
          <TextField
            label="Länge"
            name="duration"
            type="number"
            sx={{ width: '50%' }}
            defaultValue={tournament.duration}
          />
          <TextField fullWidth label="Straße" name="street" defaultValue={tournament.address.street} />
          <TextField fullWidth label="Trainer" name="trainer" defaultValue={tournament.trainer} />
          <TextField fullWidth label="Zielgruppe" name="skillLevel" defaultValue={tournament.skillLevel} />
          <TextField fullWidth label="Beschreibung" name="description" defaultValue={tournament.description} />
          <Box textAlign="right">
            <Button type="submit" onClick={() => setEdit(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary">
              Speichern
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  ) : (
    <Box sx={{ width: '100%' }} flexDirection="column" display="flex" gap={2}>
      {tournament ? (
        <>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h4">{tournament.name}</Typography>
            <AdminStuff>
              <MenuButton>
                <MenuItem onClick={() => setEdit(true)}>Bearbeiten</MenuItem>
              </MenuButton>
            </AdminStuff>
          </Box>
          <Box>
            <Paper>
              Infos zum Turnier
            </Paper>
          </Box>
          {tournament.teams.map((team) => {
            return (
              <Box key={team._id}>
                <Paper>
                  <Box display="flex" padding={2}>
                    <Box flexGrow={1} width="100%">
                      <Typography variant="h5">{team.name}</Typography>
                    </Box>
                    <TeamState team={team} />
                    <IconButton onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}>
                      {expandedTeam === team._id ? <ExpandLessIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Box>
                  <Collapse in={expandedTeam === team._id}>
                    <Box display="flex" flexDirection="column">
                      {tournament.participants
                        .filter((p) => p.team === team._id)
                        .map((p) => (
                          <Box key={p._id}>
                            {p.state} {p.username}
                          </Box>
                        ))}
                    </Box>
                  </Collapse>
                </Paper>
              </Box>
            );
          })}
        </>
      ) : (
        <Box>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="rectangular" width="100%" height={200} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="50%" height={24} />
          <Skeleton variant="text" width="70%" height={24} />
        </Box>
      )}
    </Box>
  );
};

export default Tournament;
