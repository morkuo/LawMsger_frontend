const steps = [
  {
    element: '#groupAddParticipants',
    title: 'Manage Group Channel',
    content: 'Create group channel, add or delete group member',
  },
  {
    element: '#profile',
    title: 'Edit Profile',
    content: 'Edit password or profile picture',
  },
];

const role = localStorage.getItem('role');

if (role === '-1')
  steps.push({
    element: '#adminButton',
    title: 'Admin Panel',
    content: 'Edit Firm Logo, create or delete user account',
  });

// Instance the tour
const tour = new Tour({
  steps,
});

tour.init();

// Start the tour
tour.restart();
