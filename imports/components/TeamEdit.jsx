import { DialogTitle, DialogContent, Dialog, DialogActions } from '@mui/material';
import React, { Suspense, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { Skeleton } from '@mui/material';
import UltiSite from '../Ultisite.js';
import MultipleSelect from './MultipleSelect.jsx';
import { useAppContext } from './App.jsx';

const Editor = React.lazy(() => import('react-simple-wysiwyg'));

const TeamEdit = ({ open, team, tournament, onClose }) => {
  const settings = UltiSite.settings();
  const { notifyUser } = useAppContext();
  return (
    <Dialog open={open} onClose={onClose}>
      <form
        onSubmit={(evt) => {
          evt.preventDefault();
          const data = {};
          [...evt.target.getElementsByTagName('input')].forEach((input) => {
            if ('date' === input.type) data[input.name] = input.valueAsDate;
            else if ('number' === input.type) data[input.name] = input.valueAsNumber;
            else if ('surfaces' === input.name) data[input.name] = input.value.split(',');
            else if ('divisions' === input.name) data[input.name] = input.value.split(',');
            else data[input.name] = input.value;
          });
          console.log(data);

          Meteor.callAsync(team._id ? 'teamUpdate' : 'addTeam', { ...data, _id: team._id }, tournament._id)
            .then(() => {
              onClose();
            })
            .catch((err) => {
              notifyUser({ message: err.message, severity: 'error' });
            });

          return false;
        }}>
        <DialogTitle> {team._id ? 'Team bearbeiten' : 'Neues Team Anlegen'}</DialogTitle>
        {open ? (
          <DialogContent>
            <Box
              position="relative"
              display="flex"
              flexDirection="column"
              minWidth={400}
              maxWidth={600}
              justifyContent="space-evenly"
              gap={2}
              padding={2}>
              <TextField fullWidth label="Teamname" name="name" defaultValue={team.name} />
              <MultipleSelect
                fullWidth
                name="teamType"
                label="Art des Teams"
                defaultValue={(team.teamType && team.teamType.split(' - ')) || ['Verein', 'Auslosung']}
                options={['Verein', 'Auslosung', 'Offiziell', 'International', 'Extern / Projekt']}
              />
              <Select fullWidth label="Division" name="division" defaultValue={team.division}>
                {tournament.divisions.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              <Select fullWidth label="Status" name="state" defaultValue={team.state}>
                <MenuItem value={''}>nicht gemeldet</MenuItem>
                <MenuItem value={'angemeldet'}>angemeldet</MenuItem>
                <MenuItem value={'dabei'}>angemeldet</MenuItem>
                <MenuItem value={'auf Warteliste'}>angemeldet</MenuItem>
                <MenuItem value={'abgesagt'}>angemeldet</MenuItem>
              </Select>
              <TextField
                label="Maximale Spieler"
                name="maxPlayers"
                type="number"
                sx={{ width: '50%' }}
                defaultValue={team.maxPlayers}
              />
              <TextField
                label="Minimum Frauen"
                name="minFemale"
                type="number"
                sx={{ width: '50%' }}
                defaultValue={team.minFemale}
              />
            </Box>
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button color="inherit" onClick={() => onClose()}>
            Abbrechen
          </Button>
          <Button type="submit" color="primary">
            {team._id ? 'Speichern' : 'Anlegen!'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeamEdit;
