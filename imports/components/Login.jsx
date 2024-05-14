import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Authenticator.jsx';
import { Typography } from '../../node_modules/@mui/material/index';

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const Login = ({ children }) => {
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    Meteor.loginWithPassword(username, password, (err) => {
      if (err) setError(err.message);
      setLoggingIn(false);
    });
  };
  useEffect(() => {
    if (user) navigate('/');
  });
  return (
    <Box display="flex" justifyContent="center">
      <Paper>
        <form onSubmit={submit}>
          <Box display="flex" flexDirection="column" padding={2} gap={1}>
            <Typography variant="h5">Anmeldung für den internen Bereich</Typography>
            <br />
            <br />
            <TextField
              label="E-Mail"
              value={username}
              id="username"
              onChange={(evt) => setUsername(evt.target.value)}
            />
            <TextField
              label="Passwort"
              value={password}
              id="password"
              onChange={(evt) => setPassword(evt.target.value)}
              type="password"
            />
            <Box textAlign="right">
              <Button disabled={loggingIn} type="submit">
                Anmelden
              </Button>
            </Box>
            {loggingIn ? <LinearProgress /> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
