import React, { createContext, useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import { Dialog, Button, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Alert from '@mui/material/Alert';
import Router from './Router.jsx';

const AppContext = createContext({});

/**
 * notifyUser to notify a user using a snackbar
 *
 * @callback NotifyUserFunc
 * @param {object} params
 * @param {string} params.message
 * @param {import('@mui/material').AlertColor} params.severity
 * @returns {void}
 */

/**
 * confirm to to confirm a user input
 *
 * @callback ConfirmFunc
 * @param {object} params
 * @param {string} params.text
 * @param {string} params.title
 * @param {string} params.okText
 * @param {string} params.cancelText
 * @param {function} params.onOk
 * @param {function} params.onCancel
 * @returns {void}
 */

/**
 * Notify user with snackbar
 * @param {import('@mui/material').AlertColor}
 * @returns {{notifyUser:NotifyUserFunc, confirm: ConfirmFunc}}
 */
export const useAppContext = () => useContext(AppContext);

const App = () => {
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const notifyUser = ({ message, severity }) => setNotification({ message, severity });
  const confirm = ({ text, title = 'Bestätigung', onOk, onCancel,okText="Ok", cancelText="Abbrechen" }) =>
    setConfirmDialog({ text, title, onOk, onCancel,okText, cancelText });
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        alignContent: 'stretch',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}>
      <AppContext.Provider value={{ notifyUser, confirm }}>
        <Router />
      </AppContext.Provider>
      <Dialog open={!!confirmDialog} autoHideDuration={6000} onClose={() => setConfirmDialog(null)}>
        {confirmDialog ? (
          <DialogContent>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContentText>{confirmDialog.text}</DialogContentText>
            <DialogActions>
              {confirmDialog.onCancel ? (
                <Button
                  onClick={() => {
                    setConfirmDialog(null);
                    confirmDialog.onCancel();
                  }}>
                  {confirmDialog.cancelText}
                </Button>
              ) : null}
              {confirmDialog.onOk ? (
                <Button
                  color="primary"
                  onClick={async () => {
                    if (await confirmDialog.onOk()) setConfirmDialog(null);
                  }}>
                  {confirmDialog.okText}
                </Button>
              ) : null}
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
      <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
        {notification ? (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
};
export default App;
