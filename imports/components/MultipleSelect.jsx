import React from 'react';
import { FormControl, InputLabel, useTheme, OutlinedInput, Box, MenuItem } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';

export default function MultipleSelect({ defaultValue, label, options, fullWidth, ...props }) {
  return (
    <div>
      <FormControl fullWidth={fullWidth}>
        <InputLabel>{label}</InputLabel>
        <Select
          labelId="demo-multiple-chip-label"
          id="demo-multiple-chip"
          multiple
          defaultValue={defaultValue}
          input={<OutlinedInput label={label} {...props} />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected || []).map((v) => (
                <Chip key={v} label={v} />
              ))}
            </Box>
          )}>
          {(options || []).map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
