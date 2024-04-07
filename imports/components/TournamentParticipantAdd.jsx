import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { RadioGroupRating, participantStates } from './TournamentParticipant.jsx';
import { stateToPercentState } from '../helpers.js';

const TournamentParticipantAdd = ({ team, tournament }) => {
  const [playDialog, setPlayDialog] = useState(false);
  const [state, setState] = useState(1);
  const [search, setSearch] = useState('');
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(Meteor.user());
  const fullScreenDialog = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const userSearch = useTracker(() => {
    const handler = Meteor.subscribe('UserSearch', { search, options: { limit: 10 } });

    return Meteor.users
      .find({
        $or: [
          { username: { $regex: `^${search}`, $options: 'i' } },
          { 'profile.name': { $regex: `^${search}`, $options: 'i' } },
        ],
      })
      .fetch();
  });
  console.log({ userid: user?._id, userSearch, comment, state: state - 1 });
  return (
    <>
      <Button fullWidth onClick={() => setPlayDialog(true)}>
        Spieler eintragen
      </Button>
      <Dialog fullScreen={fullScreenDialog} open={playDialog}>
        <DialogTitle>Spieler eintragen</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <DialogContentText>Hier kannst du dich oder einen anderen Spieler beim Team eintragen.</DialogContentText>
            <Autocomplete
              getOptionKey={(opt) => opt._id}
              value={user}
              isOptionEqualToValue={(opt, value) => opt._id === value._id}
              getOptionLabel={(opt) => `${opt.username} - ${opt.profile.name} ${opt.profile.surname}`}
              onInputChange={(evt, value) => setSearch(value)}
              renderInput={(params) => <TextField {...params} label="Ausgewählter Spieler" />}
              onChange={(_, value) => setUser(value)}
              options={[
                ...userSearch,
                { _id: search, username: search, profile: { name: '<fremder', surname: 'Nutzer>' } },
              ]}
            />
            <Box display="flex" flexDirection="row" gap={2}>
              <RadioGroupRating value={state} onChange={(_, value) => setState(value)} />
              <Typography>{participantStates[state].label}</Typography>
            </Box>
            <TextField
              autoFocus
              required
              margin="dense"
              id="comment"
              name="comment"
              label="Kommentar"
              type="text"
              fullWidth
              onChange={(evt) => setComment(evt.currentTarget.value || '')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayDialog(false)}>Abbrechen</Button>
          <Button
            onClick={async () => {
              try {
                await Meteor.callAsync(
                  'participantInsert',
                  { userid: user._id, comment, state: stateToPercentState(state) },
                  team._id
                );
                setPlayDialog(false);
              } catch (err) {
                console.error(err.message);
              }
            }}>
            Eintragen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TournamentParticipantAdd;
