import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const MenuButton = ({ children }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  return (
    <>
      {' '}
      <IconButton aria-label="settings" onClick={(evt) => setMenuAnchor(evt.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}>
        {children}
      </Menu>
    </>
  );
};

export default MenuButton;
