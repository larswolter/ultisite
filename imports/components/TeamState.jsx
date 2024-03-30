import { Box } from '@mui/material';
import React, { PureComponent } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  PieChart,
} from 'recharts';

const TeamState = ({ team }) => {
  console.log(`TeamState ${team.name}`, team.teamInfo);
  const data = [
    { name: 'full', value: team.teamInfo.full, color: 'green' },
    { name: 'half', value: team.teamInfo.half, color: 'orange' },
    { name: 'rest', value: team.teamInfo.rest, color: 'gray' },
    { name: 'spots', value: team.teamInfo.spots, color: 'lightgray' },
    { name: 'over', value: team.teamInfo.over, color: 'red' },
  ];
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (Number(value))
      return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          {value}
        </text>
      );
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={100}>
      <PieChart>
        <Pie
          label={renderCustomizedLabel}
          labelLine={false}
          dataKey="value"
          nameKey="name"
          startAngle={180}
          endAngle={0}
          paddingAngle={3}
          data={data}
          cx="50%"
          cy="100%"
          outerRadius={80}
          innerRadius={40}
          fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TeamState;
