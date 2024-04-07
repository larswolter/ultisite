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
import ExpandIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import DivisionIcon from '@mui/icons-material/Groups';
import SurfaceIcon from '@mui/icons-material/Water';
import MenuButton from './MenuButton.jsx';
import { Chip, Collapse, IconButton, Skeleton, Slide } from '@mui/material';
import AdminStuff from './AdminStuff.jsx';
import { useTracker } from 'meteor/react-meteor-data';
import UltiSite from '../Ultisite.js';
import { useParams } from 'react-router-dom';
import TeamState from './TeamState.jsx';


const TournamentEdit = ({tournament, setEdit})=>{
    return <form
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
}

export default TournamentEdit;