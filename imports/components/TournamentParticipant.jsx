import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Rating from '@mui/material/Rating';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { percentStateToState, stateToPercentState } from '../helpers';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Modal,
  Skeleton,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

const StyledRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconEmpty .MuiSvgIcon-root': {
    color: theme.palette.action.disabled,
  },
}));

export const participantStates = {
  1: {
    icon: <SentimentVeryDissatisfiedIcon title="'Kann nicht" sx={{ color: 'black' }} />,
    label: 'Kann nicht',
  },
  2: {
    icon: <SentimentSatisfiedIcon title="'interessiert" sx={{ color: 'gray' }} />,
    label: 'interessiert',
  },
  3: {
    icon: <SentimentSatisfiedAltIcon title="'Wahrscheinlich" sx={{ color: 'orange' }} />,
    label: 'Wahrscheinlich',
  },
  4: {
    icon: <SentimentVerySatisfiedIcon title="'Sicher dabei" sx={{ color: 'green' }} />,
    label: 'Sicher dabei',
  },
};

function IconContainer(props) {
  const { value, ...other } = props;
  return <span {...other}>{participantStates[value].icon}</span>;
}

export const RadioGroupRating = (props) => {
  return (
    <StyledRating
      IconContainerComponent={IconContainer}
      getLabelText={(v) => participantStates[v].label}
      highlightSelectedOnly
      max={4}
      {...props}
    />
  );
};
const TournamentParticipant = ({ participant }) => {
  const [edit, setEdit] = useState(false);

  return (
    <>
      <Divider />
      {participant ? (
        <Box display="flex" gap={1} alignItems="center">
          {edit ? (
            <RadioGroupRating value={edit.state} onChange={(_, value) => setEdit({ ...edit, state: value })} />
          ) : (
            participantStates[percentStateToState(participant.state) + 1].icon
          )}

          <Typography variant="body1">
            {participant.username}
            {participant.sex === 'W' ? <FemaleIcon fontSize="inherit" /> : <MaleIcon fontSize="inherit" />}
          </Typography>
          <Typography variant="body2" flex={1}>
            {edit ? (
              <TextField
                fullWidth
                size="small"
                value={edit.comment}
                onChange={(evt) => setEdit({ ...edit, comment: evt.target.value })}
              />
            ) : (
              participant.comment
            )}
          </Typography>
          {edit ? (
            <>
              <IconButton onClick={() => setEdit(false)}>
                <CancelIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => {
                  Meteor.call(
                    'participationUpdate',
                    participant.team,
                    participant.user,
                    stateToPercentState(edit.state),
                    edit.comment
                  );
                  setEdit(false);
                }}>
                <SaveIcon />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() =>
                setEdit({ state: percentStateToState(participant.state) + 1, comment: participant.comment })
              }>
              <EditIcon />
            </IconButton>
          )}
        </Box>
      ) : (
        <Skeleton variant='text' height={24}></Skeleton>
      )}
    </>
  );
};

export default TournamentParticipant;
