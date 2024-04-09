import { CircularProgress } from '@mui/material';
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
  if(!team || !team.teamInfo) return <CircularProgress />
  const femaleData = [
    { name: 'femalesFull', value: team.teamInfo.femalesFull, color: 'green' },
    { name: 'femalesHalf', value: team.teamInfo.femalesHalf, color: 'orange' },
    { name: 'missingFemales', value: team.teamInfo.missingFemales, color: 'red' },
    {
      name: 'rest',
      value: team.maxPlayers - team.teamInfo.missingFemales - team.teamInfo.femalesHalf - team.teamInfo.femalesFull,
      color: 'lightgray',
    },
  ];
  const data = [
    { name: 'full', value: team.teamInfo.full, color: 'green' },
    { name: 'half', value: team.teamInfo.half, color: 'orange' },
    { name: 'rest', value: team.teamInfo.rest, color: 'gray' },
    { name: 'spots', value: team.teamInfo.spots, color: 'lightgray' },
    { name: 'over', value: team.teamInfo.over, color: 'red' },
  ];
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, color }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (Number(value))
      return (
        <text x={x} y={y} fill={['red','green'].includes(color)?'white':'black'} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          {value}
        </text>
      );
    return null;
  };
  const withFemaleChart = team.minFemale && team.minFemale < team.maxPlayers;
  
  return (
    <ResponsiveContainer width="100%" minWidth={180} flex={1} height={100}>
      <PieChart>
        {withFemaleChart ? (
          <Pie
            label={renderCustomizedLabel}
            labelLine={false}
            dataKey="value"
            nameKey="name"
            startAngle={180}
            endAngle={0}
            paddingAngle={1}
            data={femaleData}
            cx="50%"
            cy="100%"
            outerRadius={92}
            innerRadius={67}
            fill="#8884d8">
            {femaleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        ) : null}
        <Pie
          label={renderCustomizedLabel}
          labelLine={false}
          dataKey="value"
          nameKey="name"
          startAngle={180}
          endAngle={0}
          paddingAngle={1}
          data={data}
          cx="50%"
          cy="100%"
          outerRadius={withFemaleChart?65:90}
          innerRadius={withFemaleChart?40:50}
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
