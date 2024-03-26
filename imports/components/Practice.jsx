import React, { useState } from 'react';
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
import MenuButton from './MenuButton.jsx';

/**
 * Single Practice
 * @param {object} props
 * @param {object} props.practice
 * @returns
 */
const Practice = ({ practice }) => {
  const [edit, setEdit] = useState(false);
  return edit ? (
    <Paper sx={{ maxWidth: 600, minWidth: 250, flex: 1, width: '100%' }}>
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
          Meteor.callAsync('updatePractice', practice._id, { $set: data })
            .then(() => {
              setEdit(false);
            })
            .catch((err) => {
              console.error(err);
            });
          return false;
        }}>
        <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="space-evenly" gap={2} padding={2}>
          <TextField fullWidth label="Veranstalter" name="hostingTeam" defaultValue={practice.hostingTeam} />
          <TextField fullWidth label="Wochentag" name="weekday" defaultValue={practice.weekday} />
          <TextField
            label="Erstes Training"
            name="start"
            type="date"
            sx={{ width: '50%' }}
            defaultValue={new Date(practice.start).toISOString().substr(0, 10)}
          />
          <TextField
            label="Letztes Training"
            name="end"
            type="date"
            sx={{ width: '50%' }}
            defaultValue={new Date(practice.end).toISOString().substr(0, 10)}
          />
          <TextField label="Beginn" name="startTime" sx={{ width: '50%' }} defaultValue={practice.startTime} />
          <TextField
            label="Länge"
            name="duration"
            type="number"
            sx={{ width: '50%' }}
            defaultValue={practice.duration}
          />
          <TextField fullWidth label="Straße" name="street" defaultValue={practice.address.street} />
          <TextField fullWidth label="Trainer" name="trainer" defaultValue={practice.trainer} />
          <TextField fullWidth label="Zielgruppe" name="skillLevel" defaultValue={practice.skillLevel} />
          <TextField fullWidth label="Beschreibung" name="description" defaultValue={practice.description} />
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
    <Card sx={{ maxWidth: 600, minWidth: 250, flex: 1, width: '100%' }} key={practice._id}>
      <CardHeader
        action={
          <MenuButton>
            <MenuItem onClick={() => setEdit(true)}>Bearbeiten</MenuItem>
          </MenuButton>
        }
        title={`${dayjs().startOf('week').add(practice.weekday, 'days').format('dddd')}s ${practice.startTime} Uhr `}
        subheader={`${practice.address.street},${practice.address.plz} ${practice.address.city}`}
      />
      <CardMedia component="div" sx={{ height: 200, position: 'relative' }}>
        <PracticeMap location={practice.address} />
      </CardMedia>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Von {new Date(practice.start).toLocaleDateString()} bis {new Date(practice.end).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {practice.skillLevel}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {practice.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default Practice;
