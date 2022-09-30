const duration = 7000;
const delay = 500;

mainTour();

function mainTour() {
  let steps = [
    {
      element: '#all',
      title: 'All Colleagues',
      content: 'Click to show all colleagues',
      onNext: () => $('#all .header').click(),
    },
    {
      element: '.contact-add-star-button:first',
      title: 'Mark frequent contacts',
      content: 'Add the colleague to "Starred" block',
    },
    {
      element: '#star',
      title: 'Starred Colleagues',
      content: 'Click to show starred colleagues',
      onNext: () => $('#star .header').click(),
    },
    {
      element: '.contact-delete-star-button:first',
      title: 'Remove frequent contacts',
      content: 'Remove the colleague from "Starred" block',
    },
    {
      element: '#group',
      title: 'Group Channels',
      content: 'Click to show groups you have joined',
      onNext: () => $('#group .header').click(),
    },
    {
      element: '.group-delete-button:first',
      title: 'Leave Group Channel',
      content: 'If you are the host of the group, the group will be dissolved',
    },
  ];

  const role = localStorage.getItem('role');

  if (role === '-1') {
    steps.push({
      element: '#adminButton',
      title: 'Admin Panel',
      content: 'Edit Firm Logo, create or delete user account',
      placement: 'top',
    });
  }

  steps = [
    ...steps,
    {
      element: '#profile',
      title: 'Edit Profile',
      content: 'Edit password or profile picture',
      placement: 'top',
    },
    {
      element: '#groupAddParticipants',
      title: 'Manage Groups',
      content: 'Create group, add or delete member',
      placement: 'top',
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    steps,
    duration,
    delay,
  });

  tour.init();
  tour.restart();
}

function groupTour() {
  const steps = [
    {
      element: 'input.group-function:first',
      title: 'Create a Group',
      content: 'Enter the name of the new group and click "create"',
      onShown: () => $('#group .header').click(),
      onNext: tour => {
        const groupName = 'Google v. Oracle';
        typeWriter('input.group-function:first', groupName, 0);

        const currentStepIndex = tour.getCurrentStep();

        tour.end();
        setTimeout(() => {
          $('form.group-function:first button.group-function').click();
          tour.restart();
          tour.goTo(currentStepIndex + 1);
        }, 1300);
      },
    },
    {
      element: '[data-name="Google v. Oracle"]',
      title: 'Chat in Group',
      content: 'Click to enter the group conversation',
      onNext: () => $('[data-name="Google v. Oracle"]').click(),
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    steps,
    duration,
    delay,
  });

  tour.init();
  tour.restart();
}

function searchTour() {
  const steps = [
    {
      element: '#input',
      title: 'Search For Regulations',
      content: 'To search regulations by their content, Enter " | " symbol followed by the keyword',
      backdrop: true,
      placement: 'top',
      onNext: () => {
        typeWriter('#input', '|電腦程式著作', 0);
        const input = document.getElementById('input');
        input.dispatchEvent(new KeyboardEvent('keydown'));
      },
    },
    {
      element: '#suggestions',
      title: 'Search For Regulations',
      content: 'Search result',
      backdrop: true,
      placement: 'top',
    },
    {
      element: '#input',
      content: 'Or search by the name and the article of the regulations',
      backdrop: true,
      placement: 'top',
    },
    {
      element: '#input',
      title: 'Search For Regulations',
      content: 'Enter " @ " symbol followed by the name of the clauses and its number',
      backdrop: true,
      placement: 'top',
      onNext: () => {
        $('#input').val('');
        typeWriter('#input', '@民法105', 0);
        const input = document.getElementById('input');
        input.dispatchEvent(new KeyboardEvent('keydown'));
      },
    },
    {
      element: '#suggestions',
      title: 'Search For Regulations',
      content: 'Press "Tab" to move between results',
      backdrop: true,
      placement: 'top',
      onShown: () => {
        const input = document.getElementById('input');
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
          }, i * 700);
        }
      },
    },
    {
      element: '#suggestions',
      title: 'Search For Regulations',
      content: 'Press " Enter " to select',
      backdrop: true,
      placement: 'top',
      onNext: () => {
        const input = document.getElementById('input');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      },
    },
    {
      element: '#input',
      title: 'Search For Regulations',
      content: 'The selected clause will be added',
      backdrop: true,
      placement: 'top',
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    steps,
    duration,
    delay,
  });

  tour.init();
  tour.restart();
}

function typeWriter(selector, text, i) {
  const speed = 50; /* The speed/duration of the effect in milliseconds */

  if (i < text.length) {
    $(selector).val($(selector).val() + text[i]);
    i++;
    setTimeout(typeWriter, speed, selector, text, i);
  }
}

export { searchTour, groupTour };
