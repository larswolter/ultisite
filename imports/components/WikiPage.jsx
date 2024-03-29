import React, { useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import StarterKit from '@tiptap/starter-kit';
import Button from '@mui/material/Button';
import { Skeleton } from '@mui/material';
import UltiSite from '../Ultisite.js';
import { useTracker } from 'meteor/react-meteor-data';
import {
  MenuButtonBold,
  MenuButtonEditLink,
  MenuButtonItalic,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
} from 'mui-tiptap';
import AdminStuff from './AdminStuff.jsx';

/**
 * Single Practice
 * @param {object} props
 * @param {object} props.practice
 * @returns
 */
const WikiPage = ({ name }) => {
  const [edit, setEdit] = useState(false);
  const { page, isLoading } = useTracker(() => {
    const sub = Meteor.subscribe('WikiPage', name);
    return { page: UltiSite.WikiPages.findOne({ name }) || {}, isLoading: !sub.ready() };
  });
  const rteRef = useRef(null);
  return edit ? (
    <Paper sx={{ maxWidth: 800, minWidth: 300, flexShrink: 0, flexGrow: 1, width: '100%' }}>
      <Box display="flex" flexDirection="column" minHeight={400} gap={2} padding={2}>
        <RichTextEditor
          ref={rteRef}
          RichTextFieldProps={{ minHeight: 400 }}
          extensions={[StarterKit]}
          content={page.content || ''} // Initial content for the editor
          // Optionally include `renderControls` for a menu-bar atop the editor:
          renderControls={() => (
            <MenuControlsContainer>
              <MenuSelectHeading />
              <MenuDivider />
              <MenuButtonBold />
              <MenuButtonItalic />
              <MenuButtonEditLink />
            </MenuControlsContainer>
          )}
        />
        <Box textAlign="right">
          <Button onClick={() => setEdit(false)}>Abbrechen</Button>
          <Button
            variant="primary"
            onClick={() => {
              Meteor.callAsync('updateWikiPage', name, rteRef.current?.editor?.getHTML())
                .then(() => {
                  setEdit(false);
                })
                .catch((err) => {
                  console.error(err);
                });
              return false;
            }}>
            Speichern
          </Button>
        </Box>
      </Box>
    </Paper>
  ) : (
    <Box position="relative" maxWidth={800} width="100%">
      {!isLoading ? (
        <>
          <AdminStuff>
            <Button sx={{ float: 'right' }} onClick={() => setEdit(true)}>
              Bearbeiten
            </Button>
          </AdminStuff>
          <div
            dangerouslySetInnerHTML={{ __html: page.content ? page.content : '&lt;Noch kein Inhalte vorhanden&gt;' }}
          />
        </>
      ) : (
        <Box>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="50%" height={24} />
          <Skeleton variant="text" width="70%" height={24} />
        </Box>
      )}
    </Box>
  );
};

export default WikiPage;
