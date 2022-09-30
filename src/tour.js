const steps = [
  {
    element: '#all',
    title: 'All Colleagues',
    content: 'Click to show all colleagues',
  },
  {
    element: '#star',
    title: 'Starred Colleagues',
    content: 'Click to show starred colleagues',
  },
  {
    element: '#group',
    title: 'Group Channels',
    content: 'Click to show group channels you have joined',
  },
  {
    element: '#groupAddParticipants',
    title: 'Manage Group Channel',
    content: 'Create group channel, add or delete group member',
    placement: 'top',
  },
  {
    element: '#profile',
    title: 'Edit Profile',
    content: 'Edit password or profile picture',
    placement: 'top',
  },
];

const role = localStorage.getItem('role');

if (role === '-1')
  steps.push({
    element: '#adminButton',
    title: 'Admin Panel',
    content: 'Edit Firm Logo, create or delete user account',
    placement: 'top',
  });

// eslint-disable-next-line no-undef
const tour = new Tour({
  steps,
});

tour.init();

// Start the tour
tour.restart();
