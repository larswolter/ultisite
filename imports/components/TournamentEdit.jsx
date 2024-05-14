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
import UltiSite from '../Ultisite.js';
import MultipleSelect from './MultipleSelect.jsx';
import { useAppContext } from './App.jsx';

const Editor = React.lazy(() => import('react-simple-wysiwyg'));

const TournamentEdit = ({ open, tournament, onClose }) => {
  const settings = UltiSite.settings();
  const { notifyUser } = useAppContext();
  const [description, setDescription] = useState((tournament.description || []).map((d) => d.content).join(''));
  useEffect(() => {
    setDescription((tournament.description || []).map((d) => d.content).join(''));
  }, [tournament.description]);
  return (
    <Dialog open={open} onClose={onClose}>
      <form
        onSubmit={(evt) => {
          evt.preventDefault();
          const data = { description };
          [...evt.target.getElementsByTagName('input')].forEach((input) => {
            if ('date' === input.type) data[input.name] = input.valueAsDate;
            else if ('number' === input.type) data[input.name] = input.valueAsNumber;
            else if ('surfaces' === input.name) data[input.name] = input.value.split(',');
            else if ('divisions' === input.name) data[input.name] = input.value.split(',');
            else data[input.name] = input.value;
          });
          console.log(data);

          Meteor.callAsync(tournament._id ? 'tournamentUpdate' : 'tournamentInsert', {
            ...data,
            _id: tournament._id,
          })
            .then(() => {
              onClose();
            })
            .catch((err) => {
              notifyUser({ message: err.message, severity: 'error' });
            });

          return false;
        }}>
        <DialogTitle> {tournament._id ? 'Turnier bearbeiten' : 'Neues Turnier Anlegen'}</DialogTitle>
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
              <TextField fullWidth label="Turniername" name="name" defaultValue={tournament.name} />
              <Select fullWidth label="Kategorie" name="category" defaultValue={tournament.category}>
                {settings.arrayCategorys.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label="Datum"
                name="date"
                type="date"
                sx={{ width: '50%' }}
                defaultValue={tournament.date ? new Date(tournament.date).toISOString().substring(0, 10) : undefined}
              />
              <TextField
                label="Anzahl Tage"
                name="numDays"
                type="number"
                sx={{ width: '50%' }}
                defaultValue={tournament.numDays}
              />
              <TextField fullWidth label="Stadt" name="address.city" defaultValue={tournament.address?.city} />
              <MultipleSelect
                fullWidth
                defaultValue={tournament.surfaces || []}
                name="surfaces"
                label="Untergründe"
                options={settings.arraySurfaces}
              />
              <MultipleSelect
                fullWidth
                name="divisions"
                label="Divisionen"
                defaultValue={tournament.divisions || []}
                options={settings.arrayDivisions}
              />
              <Typography variant="caption">Beschreibung</Typography>
              <Suspense fallback={<div>Loading...</div>}>
                <Editor name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Suspense>
            </Box>
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button color="inherit" onClick={() => onClose()}>
            Abbrechen
          </Button>
          <Button type="submit" color="primary">
            {tournament._id ? 'Speichern' : 'Anlegen!'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TournamentEdit;
