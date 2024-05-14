import { DialogTitle, DialogContent, Dialog, DialogActions } from '@mui/material';
import React, { Suspense, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import UltiSite from '../Ultisite.js';
import MultipleSelect from './MultipleSelect.jsx';
import { useAppContext } from './App.jsx';

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
          if (!data.state) {
            notifyUser({ severity: 'error', message: 'Status muss ausgewählt werden' });
            return;
          }
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
              <TextField fullWidth label="Teamname" name="name" defaultValue={team.name || settings.teamname} />
              <MultipleSelect
                fullWidth
                name="teamType"
                label="Art des Teams"
                defaultValue={(team.teamType && team.teamType.split(' - ')) || ['Verein', 'Auslosung']}
                options={['Verein', 'Auslosung', 'Offiziell', 'International', 'Extern / Projekt']}
              />
              <FormControl fullWidth required>
                <InputLabel id="division-label">Division</InputLabel>
                <Select label="Division" name="division" defaultValue={team.division || tournament.divisions[0]}>
                  {tournament.divisions.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel id="division-label">Status</InputLabel>
                <Select fullWidth label="Status" name="state" defaultValue={team.state}>
                  <MenuItem value={''}>nicht gemeldet</MenuItem>
                  <MenuItem value={'angemeldet'}>angemeldet</MenuItem>
                  <MenuItem value={'dabei'}>dabei</MenuItem>
                  <MenuItem value={'auf Warteliste'}>auf Warteliste</MenuItem>
                  <MenuItem value={'abgesagt'}>abgesagt</MenuItem>
                </Select>
              </FormControl>
              <Box display="flex" gap={1}>
                <TextField
                  required
                  label="Maximale Spieler"
                  name="maxPlayers"
                  type="number"
                  defaultValue={team.maxPlayers || 12}
                />
                <TextField
                  required
                  label="Minimum Frauen"
                  name="minFemale"
                  type="number"
                  defaultValue={team.minFemale || 0}
                />
              </Box>
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
